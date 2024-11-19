'use client'

import { useEffect, useState } from "react";

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

  // TODO Avoid creating extraneous `div` when https://github.com/facebook/react/issues/12014 is addressed
  return <div dangerouslySetInnerHTML={{ __html: remoteHtml }} />
}
