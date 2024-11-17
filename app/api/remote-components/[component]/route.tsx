import MyServerComponent from "@/components/MyServerComponent"
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

const components = {
  MyServerComponent
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ component: string }> }
) {
  const Component = components[(await params).component as keyof typeof components]
  if (!Component) return new Response(null, { status: 404 })

  const stream = new PassThrough()
  renderToPipeableStream(<Component />).pipe(stream)
  return new Response(stream as any)
}
