import { PassThrough } from "stream"
import { decodeReply } from "react-server-dom-webpack/server.edge"

// TODO Switch to `renderToReadableStream` when https://github.com/facebook/react/issues/26906 is fixed
//
// HACK Workaround for error:
//    You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.
// See also https://github.com/vercel/next.js/issues/71865#issuecomment-2444377726
import type { renderToPipeableStream as Type_renderToPipeableStream } from "react-dom/server"
let renderToPipeableStream: typeof Type_renderToPipeableStream
import("react-dom/server").then(module => {
  renderToPipeableStream = module.renderToPipeableStream
})


export type RemoteComponentSet = { [key: string]: (props: any) => React.ReactNode }

type RemoteComponentRouteHandler = (request: Request) => Promise<Response>

function ChildrenPlaceholder() {
  return <template data-children-placeholder />
}

export function serveRemoteComponents(components: RemoteComponentSet): RemoteComponentRouteHandler {
  return async (request) => {
    const searchParams = new URL(request.url).searchParams

    const componentName = searchParams.get("rrc")
    const Component = componentName && components[componentName]
    if (!Component) return new Response(`Unknown component: ${componentName}`, { status: 404 })
    searchParams.delete("rrc")

    const formData = new FormData()
    searchParams.forEach((value, name) => formData.append(name, value))
    const props = await decodeReply(formData)

    const stream = new PassThrough()
    renderToPipeableStream(
      <Component {...props} children={<ChildrenPlaceholder />} ref="remote-component-element" />
    ).pipe(stream)
    return new Response(stream as any)
  }
}

export type RemoteRef<T extends Element> = "remote-component-element" | [never, T]

type RemoteRefAttributes<T extends Element> = { ref?: RemoteRef<T> }

export type RemoteComponentProps<TComponent extends React.JSXElementConstructor<any>> =
  React.ComponentProps<TComponent> extends RemoteRefAttributes<infer TRef>
    ? React.PropsWithoutRef<React.ComponentProps<TComponent>> & React.RefAttributes<TRef>
    : React.ComponentProps<TComponent>
