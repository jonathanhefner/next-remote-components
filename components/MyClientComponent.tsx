'use client'

import { MutableRefObject, Ref, RefCallback, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

async function fetchRemoteComponentHtml(name: string, props: {}): Promise<string> {
  const propsJson = JSON.stringify(props)

  // TODO Use HTTP `QUERY` method when supported
  // See https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/
  const response = await fetch(`/api/remote-components/${name}?${new URLSearchParams({ p: propsJson })}`)
  if (!response.ok) throw new Error(`Could not fetch ${name} component (${response.status})`);

  return response.text()
}

type MutableRef<T> = MutableRefObject<T> | RefCallback<T>

function handleElementRef(el: HTMLElement | null, ref: MutableRef<HTMLElement | null>) {
  console.debug("ref", el)

  if (typeof ref === "function") {
    ref(el)
  } else if (ref) {
    ref.current = el
  }
}

export default function MyClientComponent() {
  const testProps = { hello: "world" }
  const testRef = useRef<HTMLElement>(null)

  const [remoteHtml, setRemoteHtml] = useState("loading...")

  useEffect(() => {
    fetchRemoteComponentHtml("MyServerComponent", testProps).then(setRemoteHtml)
  })

  const [childrenSlots, setChildrenSlots] = useState<HTMLElement[]>([])

  const refCallback = useCallback((el: HTMLElement) => {
    // TODO Use `dangerouslySetInnerHTML` when https://github.com/facebook/react/issues/31600 is fixed?
    if (el) el.innerHTML = remoteHtml

    // TODO Avoid calling when `el` is not null but `[data-ref=remote-component-element]` does not exist?
    handleElementRef(el?.querySelector("[data-ref=remote-component-element]"), testRef)

    setChildrenSlots(Array.from(el?.querySelectorAll("[data-children-slot]") ?? []))
  }, [remoteHtml])

  return <>
    <slot ref={refCallback as Ref<HTMLSlotElement>} style={{ display: "contents" }} />
    {childrenSlots.map(slot => createPortal(<MyChildComponent />, slot))}
  </>
}

function MyChildComponent() {
  return <strong>child</strong>
}
