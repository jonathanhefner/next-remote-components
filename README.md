# next-remote-components

This is a userland prototype and demo of remote components — React server components that are rendered remotely, on demand by client components, without the need for an explicit fetch or dedicated API endpoint.

See it in action at https://next-remote-components.vercel.app/.

The core implementation is in [`lib/rrc.tsx`](./lib/rrc.tsx).

My hope is that React itself will eventually implement this functionality.  In the mean time, this project serves as a proof of concept.


## Usage

To use remote components in your own project, copy [`lib/rrc.tsx`](./lib/rrc.tsx) into your project, and then follow these steps:

1. Create a server function that returns a component:

    ```tsx
    // @/lib/server-functions.tsx
    'use server'

    export async function getMyRemoteComponent() {
      return <strong>Hello from the server!</strong>
    }
    ```

2. Define a remote component via the `remote()` helper:

    ```tsx
    // @/lib/client-components.tsx
    'use client'

    import { getMyRemoteComponent } from "@/lib/server-functions"
    import { remote } from "@/lib/rrc"

    const MyRemoteComponent = remote(getMyRemoteComponent)
    ```


3. Create a client component that uses the remote component wrapped in a `<RemoteSuspense>` boundary:

    ```tsx
    // @/lib/client-components.tsx
    'use client'

    import { getMyRemoteComponent } from "@/lib/server-functions"
    import { remote, RemoteSuspense } from "@/lib/rrc"

    const MyRemoteComponent = remote(getMyRemoteComponent)

    export function MyClientComponent() {
      return (
        <RemoteSuspense fallback="Loading...">
          <p>The server says: <MyRemoteComponent /></p>
        </RemoteSuspense>
      )
    }
    ```


## Features

### Static typing

Remote components and their props are statically typed.  For example:

  ```tsx
  export async function getMyRemoteComponent(props: { value: number }) {
    return <></>
  }
  ```

  ```tsx
  const MyRemoteComponent = remote(getMyRemoteComponent)

  export function MyClientComponent() {
    return (
      <RemoteSuspense fallback="Loading...">
        {/* ERROR: Property 'value' is missing in type '{}' but required in type '{ value: number; }' */}
        <MyRemoteComponent />

        {/* ERROR: Type 'string' is not assignable to type 'number' */}
        <MyRemoteComponent value="100" />

        {/* ERROR: Type '{ children: string; value: number; }' is not assignable to type 'IntrinsicAttributes & { value: number; }' */}
        <MyRemoteComponent value={100}>child</MyRemoteComponent>

        {/* CORRECT! */}
        <MyRemoteComponent value={100} />
      </RemoteSuspense>
    )
  }
  ```

### Client components as children

Remote components support "passing" client components as children.  Behind the scenes, the remote components render a slot which is then filled with the given children.  For example:

  ```tsx
  export async function getMyRemoteComponent({ children }: { children: React.ReactNode }) {
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
  const MyRemoteComponent = remote(getMyRemoteComponent)

  export function MyClientComponent() {
    return (
      <RemoteSuspense fallback="Loading...">
        <MyRemoteComponent>child</MyRemoteComponent>
      </RemoteSuspense>
    )
  }
  ```


## Caveats

### Props must be serializable

Remote components props are serialized in the same way as server function arguments.  Thus, props values must be one of the [supported types](https://19.react.dev/reference/rsc/use-server#serializable-parameters-and-return-values).

### Memoization and rerenders

Remote components are memoized using React's [`memo`](https://19.react.dev/reference/react/memo), with special casing when passing children.  Thus, a remote component will rerender when a prop value changes according to [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).

In the future, the `remote()` helper might accept additional arguments to customize this behavior.


## Further improvements from a non-userland implementation

### DX improvements

The behavior of `<RemoteSuspense>` could be folded into React's built-in `<Suspense>` boundary.  Thus, developers could simply use `<Suspense>` as they would elsewhere.

### Performance improvements

Remote components rely on server functions which, currently, are [not recommended for data fetching](https://19.react.dev/reference/rsc/use-server#caveats) because they run sequentially and are not cacheable.  However, in the future, there may be variant of server functions which _are_ designed for data fetching.  One proposal is to special case server functions based on naming convention, such that functions that start with `get...` (e.g. `getData()`) are treated as data fetching functions.
