'use client'

import { Ref, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

async function fetchRemoteComponentHtml(name: string, props: {}): Promise<string> {
  const propsJson = JSON.stringify(props)

  // TODO Use HTTP `QUERY` method when supported
  // See https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/
  const response = await fetch(`/api/remote-components/${name}?${new URLSearchParams({ p: propsJson })}`)
  if (!response.ok) throw new Error(`Could not fetch ${name} component (${response.status})`);

  return response.text()
}

export default function MyClientComponent() {
  const [remoteHtml, setRemoteHtml] = useState("loading...")

  useEffect(() => {
    fetchRemoteComponentHtml("MyServerComponent", { hello: "world" }).then(setRemoteHtml)
  })

  const [childrenSlots, setChildrenSlots] = useState<HTMLElement[]>([])

  const refCallback = useCallback((el: HTMLElement) => {
    // TODO Use `dangerouslySetInnerHTML` when https://github.com/facebook/react/issues/31600 is fixed?
    if (el) el.innerHTML = remoteHtml
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
