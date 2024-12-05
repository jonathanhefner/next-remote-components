import { forwardRef, use, useCallback, useImperativeHandle, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import type { RemoteComponentSet } from "./rrc-server"

const pendingPromises: Record<string, Promise<string>> = {}

function useRemoteComponentHtml(name: string, route: string, props: Props): string {
  if (!globalThis.window?.document) return "" // Avoid fetch during SSR

  const url = `${route}?${new URLSearchParams({ c: name, p: JSON.stringify(props) })}`

  const htmlPromise = useMemo(() => {
    // TODO Use HTTP `QUERY` method when supported
    // See https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/
    return pendingPromises[url] ??= fetch(url).then(response => {
      if (!response.ok) throw new Error(`${response.statusText} (${response.status})`)
      return response.text()
    })
  }, [url])

  const html = use(htmlPromise)
  if (pendingPromises[url] === htmlPromise) delete pendingPromises[url]
  return html
}

function processRemoteComponentHtml(html: string): [ParentNode, ChildNode[]] {
  const container = document.createElement("div")
  container.innerHTML = html
  container.prepend(document.createComment(""))

  const childrenPlaceholderElements = container.querySelectorAll("[data-children-placeholder]")
  const childrenPlaceholders = Array.from(childrenPlaceholderElements).map(element => {
    const comment = document.createComment("")
    element.replaceWith(comment)
    return comment
  })

  return [container, childrenPlaceholders]
}

function sliceNodes(startNode: ChildNode, endNode: ChildNode): ChildNode[] {
  if (!startNode.parentNode) {
    console.error("Cannot slice because node", startNode, "is unparented")
    return []
  }

  const nodes = Array.from(startNode.parentNode.childNodes)
  const startIndex = nodes.indexOf(startNode)
  const endIndex = nodes.indexOf(endNode, startIndex)

  if (endIndex < 0) {
    console.error("Expected node", endNode, "to follow node", startNode)
    return []
  } else {
    return nodes.slice(startIndex, endIndex)
  }
}

const Placeholder = forwardRef(function (props: {}, forwardedRef: React.ForwardedRef<ChildNode>) {
  const comment = useMemo(() => document.createComment(""), [])
  useImperativeHandle(forwardedRef, () => comment, [])

  const elementRef: React.MutableRefObject<HTMLTemplateElement | null> = useRef(null)
  const swapWithComment = useCallback((element: HTMLTemplateElement) => {
    if (element) { // mount
      element.replaceWith(comment)
    } else { // unmount
      comment.replaceWith(elementRef.current!)
    }
    elementRef.current = element
  }, [])

  return <template ref={swapWithComment} />
})

function InjectChildren(
  { children, placeholder }: { children?: React.ReactNode, placeholder: ChildNode }
) {
  if (!children) return

  const firstNodeRef = useRef<ChildNode>(null)

  const containerRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null)
  const manageNodes = useCallback((container: HTMLDivElement) => {
    if (container) { // mount
      placeholder.before(...container.childNodes)
    } else { // unmount
      containerRef.current!.append(...sliceNodes(firstNodeRef.current!, placeholder))
    }
    containerRef.current = container
  }, [placeholder])

  return createPortal(
    <div hidden inert ref={manageNodes}>
      <Placeholder ref={firstNodeRef} />
      {children}
    </div>
  , document.body)
}

type Props = { children?: React.ReactNode, ref?: React.ForwardedRef<Element> }

function renderRemoteComponent(name: string, route: string, props: Props) {
  let children, ref
  ({ children, ref, ...props } = props)
  const html = useRemoteComponentHtml(name, route, props)

  const [container, childrenPlaceholders] = useMemo(() => processRemoteComponentHtml(html), [html])
  const firstNode = useMemo(() => container.firstChild!, [html])

  // HACK Server-side React ignores (i.e. does not render) `ref` attribute, so use `data-ref`
  const refElement = useMemo(() => container.querySelector("[data-ref]"), [html])
  useImperativeHandle(ref, () => refElement as Element, [html])

  const placeholderRef: React.MutableRefObject<ChildNode | null> = useRef(null)
  const manageNodes = useCallback((placeholder: ChildNode) => {
    if (placeholder) { // mount
      placeholder.before(...container.childNodes)
    } else { // unmount
      container.append(...sliceNodes(firstNode, placeholderRef.current!))
    }
    placeholderRef.current = placeholder
  }, [html])

  return <>
    {childrenPlaceholders.map((childrenPlaceholder, i) =>
      <InjectChildren children={children} placeholder={childrenPlaceholder} key={i} />
    )}
    <Placeholder ref={manageNodes} />
  </>
}

type ResolvedComponentSet<TSet extends RemoteComponentSet> = {
  [key in keyof TSet]: (props: React.ComponentProps<TSet[key]>) => React.ReactNode
}

export function useRemoteComponents<T extends RemoteComponentSet>(route: string): ResolvedComponentSet<T> {
  return new Proxy({}, {
    get(memo: any, name: string) {
      memo[name] ??= (props: Props) => renderRemoteComponent(name, route, props)
      return memo[name]
    }
  })
}
