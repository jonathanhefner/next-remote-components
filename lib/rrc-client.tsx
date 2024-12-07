import { use, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { RemoteComponentProps, RemoteComponentSet } from "./rrc-server"

type RemoteComponentParts = [
  placeholderCallback: React.RefCallback<ChildNode>,
  childrenPlaceholders: ChildNode[],
  refElement: Element | null,
]

const pendingPromises: Record<string, Promise<RemoteComponentParts>> = {}

function useRemoteComponent(name: string, route: string, props: Props): RemoteComponentParts {
  if (!globalThis.window?.document) return [() => { }, [], null] // Avoid fetch and DOM during SSR

  const url = `${route}?${new URLSearchParams({ c: name, p: JSON.stringify(props) })}`
  const componentId = useId()

  const promise = useMemo(() => {
    // TODO Use HTTP `QUERY` method when supported
    // See https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/
    return pendingPromises[componentId] ??= fetch(url).then(async response => {
      if (!response.ok) throw new Error(`${response.statusText} (${response.status})`)
      return processRemoteComponentHtml(await response.text())
    })
  }, [url])

  useEffect(() => { delete pendingPromises[componentId] }, [url])

  return use(promise)
}

function processRemoteComponentHtml(html: string): RemoteComponentParts {
  const container = document.createElement("div")
  container.innerHTML = html

  const firstNode = document.createComment("")
  container.prepend(firstNode)

  const placeholderCallback = (placeholder: ChildNode) => {
    placeholder.before(...container.childNodes)
    return () => { container.append(...sliceNodes(firstNode, placeholder)) }
  }

  const childrenPlaceholders = Array.from(
    container.querySelectorAll("[data-children-placeholder]")
  ).map(element => {
    const comment = document.createComment("")
    element.replaceWith(comment)
    return comment
  })

  // HACK Server-side React ignores (i.e. does not render) `ref` attribute, so use `data-ref`
  const refElement = container.querySelector("[data-ref]")

  return [placeholderCallback, childrenPlaceholders, refElement]
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

function Placeholder({ ref }: { ref: React.ForwardedRef<ChildNode> }) {
  const comment = useMemo(() => globalThis.window?.document?.createComment(""), []) // Avoid DOM during SSR
  useImperativeHandle(ref, () => comment, [comment])

  const swapWithComment = useCallback((element: HTMLTemplateElement) => {
    element.replaceWith(comment)
    return () => { comment.replaceWith(element) }
  }, [comment])

  return <template ref={swapWithComment} />
}

function InjectChildren(
  { children, placeholder }: { children?: React.ReactNode, placeholder: ChildNode }
) {
  if (!children) return

  const firstNodeRef = useRef<ChildNode>(null)

  const manageNodes = useCallback((container: HTMLDivElement) => {
    placeholder.before(...container.childNodes)
    return () => { container.append(...sliceNodes(firstNodeRef.current!, placeholder)) }
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
  const [placeholderCallback, childrenPlaceholders, refElement] = useRemoteComponent(name, route, props)

  useImperativeHandle(ref, () => refElement as Element, [refElement])

  // Avoid hydration errors due to childrenPlaceholders
  const [firstRender, setFirstRender] = useState(true)
  if (firstRender) return <Placeholder ref={() => { setFirstRender(false) }} />

  return <>
    {childrenPlaceholders.map((childrenPlaceholder, i) =>
      <InjectChildren children={children} placeholder={childrenPlaceholder} key={i} />
    )}
    <Placeholder ref={placeholderCallback} />
  </>
}

type ResolvedComponentSet<TSet extends RemoteComponentSet> = {
  [key in keyof TSet]: (props: RemoteComponentProps<TSet[key]>) => React.ReactNode
}

export function useRemoteComponents<T extends RemoteComponentSet>(route: string): ResolvedComponentSet<T> {
  return new Proxy({}, {
    get(memo: any, name: string) {
      memo[name] ??= (props: Props) => renderRemoteComponent(name, route, props)
      return memo[name]
    }
  })
}
