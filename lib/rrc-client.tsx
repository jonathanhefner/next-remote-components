import { use, useCallback, useMemo, useState } from "react"
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

function setRef(ref: React.ForwardedRef<HTMLElement | null>, el: HTMLElement | null) {
  if (typeof ref === "function") {
    ref(el)
  } else if (ref) {
    ref.current = el
  }
}

type Props = { children?: React.ReactNode, ref?: React.ForwardedRef<HTMLElement | null> }

function renderRemoteComponent(name: string, route: string, props: Props) {
  let children, ref
  ({ children, ref, ...props } = props)
  const html = useRemoteComponentHtml(name, route, props)

  const [childrenSlots, setChildrenSlots] = useState<HTMLElement[]>([])

  const renderHtml = useCallback((el: HTMLElement) => {
    // TODO Use `dangerouslySetInnerHTML` when https://github.com/facebook/react/issues/31600 is fixed?
    if (el) el.innerHTML = html

    // TODO Avoid calling when `el` is not null but `[data-ref=remote-component-element]` does not exist?
    if (ref) setRef(ref, el?.querySelector("[data-ref=remote-component-element]"))

    setChildrenSlots(Array.from(el?.querySelectorAll("[data-children-slot]") ?? []))
  }, [html, ref])

  return <>
    <slot ref={renderHtml as React.Ref<HTMLSlotElement>} style={{ display: "contents" }} />
    {childrenSlots.map(slot => createPortal(children, slot))}
  </>
}

type ResolvedComponentSet<TSet extends RemoteComponentSet> = {
  [key in keyof TSet]: (props: React.ComponentProps<TSet[key]>) => React.JSX.Element
}

export function useRemoteComponents<T extends RemoteComponentSet>(route: string): ResolvedComponentSet<T> {
  return new Proxy({}, {
    get(memo: any, name: string) {
      memo[name] ??= (props: Props) => renderRemoteComponent(name, route, props)
      return memo[name]
    }
  })
}
