import { memo, use, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
// @ts-expect-error: TypeScript cannot find type declarations for this module
import { encodeReply } from "react-server-dom-webpack/client.edge"
import type { RemoteComponentProps, RemoteComponentSet } from "./rrc-server"

type PendingPromises = Map<Promise<RemoteComponentParts>, {}>

type RemoteComponentParts = [
  placeholderCallback: React.RefCallback<ChildNode>,
  childrenPlaceholders: ChildNode[],
  refElement: Element | null,
]

function useRemoteComponent(
  name: string,
  props: {},
  route: string,
  pendingPromises: PendingPromises
): RemoteComponentParts {
  if (!globalThis.window?.document) return [() => { }, [], null] // Avoid fetch and DOM during SSR

  const propsRef = useRef<{}>({ notEquivalent: Symbol() })
  const promiseRef = useRef<Promise<RemoteComponentParts>>(null)

  if (!isEquivalent(props, propsRef.current)) {
    let promise

    for (const [pendingPromise, promiseProps] of pendingPromises) {
      if (isEquivalent(props, promiseProps)) {
        promise = pendingPromise
        break
      }
    }

    if (!promise) {
      promise = fetchRemoteComponentHtml(name, props, route).then(processRemoteComponentHtml)
      pendingPromises.set(promise, props)
    }

    propsRef.current = props
    promiseRef.current = promise
  }

  useEffect(() => { pendingPromises.delete(promiseRef.current!) }, [promiseRef.current])

  return use(promiseRef.current!)
}

function isEquivalent(object1: {}, object2: {}) {
  let parity = 0

  for (const key in object1) {
    // @ts-expect-error: TypeScript does not like dynamic keys
    if (Object.is(object1[key], object2[key])) {
      parity += 1
    } else {
      return false
    }
  }

  for (const key in object2) {
    parity -= 1
  }

  return parity === 0
}

async function fetchRemoteComponentHtml(name: string, props: Props, route: string): Promise<string> {
  let encodedProps: string | URLSearchParams | FormData = await encodeReply(props)

  let searchParams
  if (typeof encodedProps === "string") {
    // "0" key is based on `decodeReply` function in ReactFlightDOMServerEdge.js
    searchParams = new URLSearchParams({ "0": encodedProps })
  } else if (encodedProps instanceof FormData) {
    // @ts-expect-error See https://github.com/microsoft/TypeScript/issues/30584
    searchParams = new URLSearchParams(encodedProps)
  } else {
    searchParams = encodedProps
  }
  searchParams.append("rrc", name)

  // TODO Use HTTP `QUERY` method when supported
  // See https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/
  const response = await fetch(`${route}?${searchParams}`)
  if (!response.ok) throw new Error(`${response.statusText} (${response.status})`)
  return await response.text()
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

function renderRemoteComponent(
  name: string,
  props: Props,
  route: string,
  pendingPromises: PendingPromises
) {
  let children, ref
  ({ children, ref, ...props } = props)

  const [placeholderCallback, childrenPlaceholders, refElement] =
    useRemoteComponent(name, props, route, pendingPromises)

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
    get(memoized: any, name: string) {
      let pendingPromises: PendingPromises

      memoized[name] ??= (
        pendingPromises = new Map<Promise<RemoteComponentParts>, {}>(),
        memo((props: Props) => renderRemoteComponent(name, props, route, pendingPromises))
      )

      return memoized[name]
    }
  })
}
