# next-remote-components

This is a userland prototype and demo of remote components — React server components that are rendered remotely, on demand by client components, without the need for an explicit fetch or dedicated API endpoint.

See it in action at https://next-remote-components-v1.vercel.app/.

The core implementation is in [`lib/rrc-server`](./lib/rrc-server.tsx) and [`lib/rrc-client`](./lib/rrc-client.tsx).

My hope is that React itself will eventually implement this functionality.  In the mean time, this project serves as a proof of concept.


## Usage

To use remote components in your own project, copy [`lib/rrc-server`](./lib/rrc-server.tsx) and [`lib/rrc-client`](./lib/rrc-client.tsx) into your project, and then follow these steps:

1. Create a server component:

    ```tsx
    // components/MyServerComponent.tsx

    export default async function MyServerComponent() {
      return <span>Hello from the server!</span>
    }
    ```

2. Create a remote component set that includes the server component:

    ```ts
    // components/my-remote-components.ts

    import MyServerComponent from "./MyServerComponent"

    export default {
      MyServerComponent,
    }
    ```

    (This step would likely be eliminated if React itself implements remote components.)

3. Create a single API endpoint that serves any remote component in the set:

    ```ts
    // app/api/remote-component/route.ts

    import myRemoteComponents from "@/components/my-remote-components"
    import { serveRemoteComponents } from "@/lib/rrc-server"

    export const GET = serveRemoteComponents(myRemoteComponents)
    ```

    (This step would likely be eliminated if React itself implements remote components.)

4. Create a client component that uses the remote component from the set:

    ```tsx
    // components/MyClientComponent.tsx

    'use client'

    import type myRemoteComponents from "@/components/my-remote-components"
    import { useRemoteComponents } from "@/lib/rrc-client"

    const { MyServerComponent } = useRemoteComponents<typeof myRemoteComponents>("/api/remote-component")

    export default function MyClientComponent() {
      return <p>The server says: <MyServerComponent /></p>
    }
    ```


## Features

### Static typing

Remote components and their props are statically typed.  For example:

  ```tsx
  export default async function MyServerComponent(props: { value: number }) {
    // ...
  }
  ```

  ```tsx
  export default function MyClientComponent() {
    return <>
      {/* ERROR: Type '{}' is missing the following properties from type '{ value: number; }': value */}
      <MyServerComponent />

      {/* ERROR: Property 'children' does not exist on type 'IntrinsicAttributes & { value: number; }' */}
      <MyServerComponent>child</MyServerComponent>

      {/* ERROR: Type 'string' is not assignable to type 'number' */}
      <MyServerComponent value="100" />

      {/* CORRECT! */}
      <MyServerComponent value={100} />
    </>
  }
  ```

### Client components as children

Remote components support "passing" client components as children.  Behind the scenes, the remote components merely render a placeholder which is then replaced with the given client components.  For example:

  ```tsx
  export default async function MyServerComponent({ children }: { children: React.ReactNode }) {
    return <>
      I have twins:

      <ul>
        <li>{children}</li>
        <li>{children}</li>
      </ul>
    </>
  }
  ```

  ```tsx
  export default function MyClientComponent() {
    return <MyServerComponent>child</MyServerComponent>
  }
  ```

### Suspense boundaries

Remote components trigger client-side `<Suspense>` boundaries while they are fetching the rendered HTML.  For example:

  ```tsx
  export default async function MyServerComponent({ query }: { query: string }) {
    const results = await execQuery(query)
    return results.map(result => <li>...</li>)
  }
  ```

  ```tsx
  export default function MyClientComponent() {
    const [query, setQuery] = useState("")

    return <>
      <input value={query} onChange={e => setQuery(e.target.value)}>

      <Suspense fallback={<p>Loading...</p>}>
        <ul>
          <MyServerComponent query={query} />
        </ul>
      </Suspense>
    </>
  }
  ```

### Refs to elements

Remote components support refs to elements, however the remote component must use the `RemoteRef` type instead of `React.Ref`, and the `data-ref` attribute instead of the `ref` attribute:

  ```tsx
  import { RemoteRef } from "@/lib/rrc-server"

  export default async function MyServerComponent(
    { ref }: { ref: RemoteRef<HTMLSpanElement> }
  ) {
    {/* Server-side React ignores (i.e. does not render) `ref` attribute, so must use `data-ref` */}
    return <span data-ref={ref}>Hello from the server!</span>
  })
  ```

  ```tsx
  export default function MyClientComponent() {
    const refCallback = (el: HTMLSpanElement) => {
      console.log("Remote component element: ", el)
    }

    return <MyServerComponent ref={refCallback} />
  }
  ```


## Caveats

There are caveats when using remote components.  However, most of these could be addressed in the future, particularly if React itself implements remote components.

### Props must be serializable

Remote components props are serialized in the same way as server action arguments.  Thus props values must be one of the [supported types](https://react.dev/reference/rsc/use-server#serializable-parameters-and-return-values).

### Serialized props should not be excessively large

Remote components are fetched using HTTP `GET`, and serialized props are passed in the URL's query string.  URLs can be subject to size limitations, depending on the infrastructure involved.  RFC 9110 _recommends_ that ["all senders and recipients support, at a minimum, URIs with lengths of 8000 octets"](https://www.rfc-editor.org/rfc/rfc9110.html#section-4.1), but that support is not _mandated_.

This issue can be addressed by using the [HTTP `QUERY` method](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/) once it is widely supported.  Alternatively, a framework-level solution could define an API endpoint that accepts both `GET` and `POST` requests, and the client could fall back to `POST` when serialized props are large.

### Remote components cannot directly embed client components

Unlike typical React server components, which are rendered as an RSC payload, remote components are currently rendered as HTML before being sent to the client.  Therefore, they do not support directly embedding client components.  (Though they do [support using client components as children](#client-components-as-children).)

This could change in the future.  Of course, if React itself implements remote components, it would likely render them as RSC payloads, and thus support embedding client components.

### Remote component ref limitations

As [mentioned above](#refs-to-elements), remote components must use `RemoteRef` instead of `React.Ref`, and the `data-ref` attribute instead of the `ref` attribute.  This is a consequence of being a userland implementation.  If React itself implements remote components, it would likely eliminate this difference.

Additionally, currently, only element refs are supported — refs to arbitrary values are not supported.  However, it might be reasonable to support refs to arbitrary serializable values in the future.


## Further improvements from a non-userland implementation

There are further improvements that could be made if remote components are implemented by React itself or a framework like Next.js.

### DX improvements

As noted in the [Usage](#usage) section, a non-userland implementation could eliminate the step of defining a remote component set.  In a userland implementation, this step is necessary to be able to "import" a remote remote in a client component module.  A non-userland implementation could instead integrate with the bundler to specially handle `import`s of remote components.

A non-userland implementation could also eliminate the step of defining an API endpoint.  Instead, the implementation could provide a managed behind-the-scenes endpoint to serve all remote components.  There could be additional benefits as well, such as enforced security.

Also, it may be possible to improve the DX of suspense boundaries for remote components, similar to the DX provided by `loading.tsx` files in Next.js.  For example, if a `MyServerComponent.loading.tsx` file is specified, perhaps it could be automatically bundled and rendered by the client component during a suspense for `<MyServerComponent>`.

### Performance improvements

Currently, remote components are not prerendered when prerendering client components, because rendering must go through the remote component API endpoint.  A non-userland implementation could render remote components directly, without going through the API endpoint.  Thus, remote components could be prerendered along with client components.

There are also various performance improvements that could be made by integrating more closely with React and framework internals.  For example, reducing the number of DOM operations when handling element placeholders and children.
