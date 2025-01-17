import { startTransition, useCallback, useContext, useEffect, useId, useState } from "react"
import { createContext } from "react"

export type RemoteComponent<TProps> = (props: TProps) => Promise<React.ReactNode>

export type UsingRemoteComponent<TProps> = [
  component: React.FunctionComponent<TProps & { fallback?: React.ReactNode }>,
  isLoading: boolean,
]

const INITIAL_PROPS = { uniqueValue: Symbol() }

export function useRemote<TProps = {}>(
  remoteComponent: RemoteComponent<TProps>
): UsingRemoteComponent<TProps> {
  const [isLoading, setIsLoading] = useState(false)

  const component = useCallback((rawProps: {}) => {
    let { children, fallback, ...props } = rawProps as any
    const [renderingProps, setRenderingProps] = useState<{}>(INITIAL_PROPS)
    const [renderedProps, setRenderedProps] = useState<{}>({})
    const [rendered, setRendered] = useState<React.ReactNode>(undefined)
    const childrenKey = `${useId()}-children`

    if (isEquivalent(props, renderingProps)) {
      props = renderingProps
    }

    useEffect(() => {
      setIsLoading(true)
      setRenderingProps(props)
      startTransition(async () => {
        const remoteProps = children ? { ...props, children: <ChildrenPortal key={childrenKey} /> } : props
        setRendered(await remoteComponent(remoteProps as TProps))
        setRenderedProps(props)
        setIsLoading(false)
      })
    }, [props])

    return (
      <ChildrenPortalContext.Provider value={children}>
        {isEquivalent(renderingProps, renderedProps) ? rendered : fallback}
      </ChildrenPortalContext.Provider>
    )
  }, [setIsLoading])

  return [component, isLoading]
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

const ChildrenPortalContext = createContext<React.ReactNode>(null)

function ChildrenPortal() {
  const children = useContext(ChildrenPortalContext)
  return children
}
