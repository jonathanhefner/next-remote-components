import { NextRequest } from "next/server"
import { PassThrough } from "stream"

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


type RemoteJSXElementConstructor<P> =
  | ((props: P) => React.JSX.Element)
  | ((props: P) => Promise<React.JSX.Element>)

export type RemoteComponentSet = { [key: string]: RemoteJSXElementConstructor<any> }

type RemoteComponentRouteHandler = (request: NextRequest) => Promise<Response>

function ChildrenPlaceholder() {
  return <template data-children-placeholder />
}

export function serveRemoteComponents(components: RemoteComponentSet): RemoteComponentRouteHandler {
  return async (request) => {
    const componentName = request.nextUrl.searchParams.get("c")
    const Component = componentName && components[componentName]
    if (!Component) return new Response(`Unknown component: ${componentName}`, { status: 404 })

    const propsJson = request.nextUrl.searchParams.get("p")
    const props = propsJson ? JSON.parse(propsJson) : {}

    const stream = new PassThrough()
    renderToPipeableStream(<Component {...props} children={<ChildrenPlaceholder />} />).pipe(stream)
    return new Response(stream as any)
  }
}

export type RemoteForwardedRef<R> = "remote-component-element" | [never, R]

export function remoteForwardRef<TProps, TRef, TReturn extends (React.JSX.Element | Promise<React.JSX.Element>)>(
  componentFn: (props: TProps, ref: RemoteForwardedRef<TRef>) => TReturn
): (props: TProps & React.RefAttributes<TRef>) => TReturn {
  return (props) => componentFn(props, "remote-component-element")
}
