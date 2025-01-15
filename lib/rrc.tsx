import { startTransition, useContext, useEffect, useId, useState } from "react"
import { createContext } from "react"

export type RemoteComponent<TProps> = (props: TProps) => Promise<React.ReactNode>

const INITIAL_PROPS = { uniqueValue: Symbol() }

export function useRemote<TProps = {}>(
  remoteComponent: RemoteComponent<TProps>
): React.FunctionComponent<TProps & { fallback?: React.ReactNode }> {
  return function(props) {
    const { children, fallback, ...newProps } = props as typeof props & { children?: React.ReactNode }

    const [rendered, setRendered] = useState<React.ReactNode>(undefined)
    const [renderedProps, setRenderedProps] = useState<{}>(INITIAL_PROPS)
    const isLoading = !isEquivalent(newProps, renderedProps)
    const childrenKey = `${useId()}-children`

    useEffect(() => {
      if (isLoading) {
        startTransition(async () => {
          const remoteProps = children ? { ...newProps, children: <ChildrenPortal key={childrenKey} /> } : newProps
          setRendered(await remoteComponent(remoteProps as TProps))
          setRenderedProps(newProps)
        })
      }
    }, [isLoading])

    return (
      <ChildrenPortalContext.Provider value={children}>
        {isLoading ? fallback : rendered}
      </ChildrenPortalContext.Provider>
    )
  }
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
