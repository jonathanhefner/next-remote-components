'use client'

import { useEffect, useState } from "react";

async function fetchRemoteComponentHtml(name: string): Promise<string> {
  const response = await fetch(`/api/remote-components/${name}`)

  if (!response.ok) throw new Error(`Could not fetch ${name} component (${response.status})`);

  return response.text()
}

export default function MyClientComponent() {
  const [remoteHtml, setRemoteHtml] = useState("loading...")

  useEffect(() => {
    fetchRemoteComponentHtml("MyServerComponent").then(setRemoteHtml)
  })

  // TODO Avoid creating extraneous `div` when https://github.com/facebook/react/issues/12014 is addressed
  return <div dangerouslySetInnerHTML={{ __html: remoteHtml }} />
}
