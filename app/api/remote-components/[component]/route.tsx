import MyServerComponent from "@/components/MyServerComponent"
import { NextRequest } from "next/server"
import { PassThrough } from "stream"

// TODO Switch to `renderToReadableStream` when https://github.com/facebook/react/issues/26906 is fixed
//
// HACK Workaround for error:
//    You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.
// See also https://github.com/vercel/next.js/issues/71865#issuecomment-2444377726
import type { renderToPipeableStream as Type_renderToPipeableStream } from "react-dom/server"
export let renderToPipeableStream: typeof Type_renderToPipeableStream
import("react-dom/server").then(module => {
  renderToPipeableStream = module.renderToPipeableStream
})

function ChildrenSlot() {
  return <slot data-children-slot style={{ display: "contents" }} />
}

const components = {
  MyServerComponent
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ component: string }> }
) {
  const Component = components[(await params).component as keyof typeof components]
  if (!Component) return new Response(null, { status: 404 })

  const propsJson = request.nextUrl.searchParams.get("p")
  const props = propsJson ? JSON.parse(propsJson) : {}

  const stream = new PassThrough()
  renderToPipeableStream(<Component {...props} children={<ChildrenSlot />} />).pipe(stream)
  return new Response(stream as any)
}
