import { ReactNode, useRef, useState, useTransition } from "react"

export type RemoteComponent<TProps> = {
  (props: TProps): Promise<ReactNode>,
  Initial?: (props: {}) => ReactNode,
  Loading?: (props: {}) => ReactNode,
  Error?: (props: { thrown: unknown }) => ReactNode,
}

export type UsingRemoteComponent<TProps> = [
  rendered: ReactNode,
  setProps: (props: TProps) => void,
  isLoading: boolean,
]

const INITIAL_PROPS = { uniqueValue: Symbol() }
const ERROR_PROPS = { uniqueValue: Symbol() }

export function useRemote<TProps extends {}>(
  remoteComponent: RemoteComponent<TProps>
): UsingRemoteComponent<TProps> {
  const [rendered, setRendered] = useState<ReactNode>(
    remoteComponent.Initial && <remoteComponent.Initial />
  )

  const [isLoading, startTransition] = useTransition()

  const propsRef = useRef<{}>(INITIAL_PROPS)

  // Use a ref to ensure that `setProps` is a stable value.  (Note that the
  // return value of `useCallback` is not guaranteed to be stable.)
  const setPropsRef = useRef<(props: TProps) => void>(null)
  setPropsRef.current ??= (props: TProps) => {
    if (!isEquivalent(propsRef.current, props)) {
      if (remoteComponent.Loading) {
        setRendered(<remoteComponent.Loading />)
      }

      startTransition(async () => {
        try {
          setRendered(await remoteComponent(props))
          propsRef.current = { ...props }
        } catch (thrown) {
          setRendered(<Throw thrown={thrown} />)
          propsRef.current = ERROR_PROPS
        }
      })
    }
  }

  return [rendered, setPropsRef.current, isLoading]
}

function isEquivalent(object1: {}, object2: {}) {
  let parity = 0

  for (const key in object1) {
    // @ts-expect-error: TypeScript does not like dynamic keys
    if (Object.is(object1[key], object2[key])) {
      parity += 1
    } else {
      return false
    }
  }

  for (const key in object2) {
    parity -= 1
  }

  return parity === 0
}

function Throw({ thrown }: { thrown: unknown }): never {
  throw thrown
}
