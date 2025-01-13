import { startTransition, useEffect, useState } from "react"

export type RemoteComponent<TProps> = (props: TProps) => Promise<React.ReactNode>

const INITIAL_PROPS = { uniqueValue: Symbol() }

export function useRemote<TProps = {}>(
  remoteComponent: RemoteComponent<TProps>
): React.FunctionComponent<TProps & { children?: React.ReactNode }> {
  return function({ children, ...newProps }) {
    const [props, setProps] = useState<{}>(INITIAL_PROPS)
    const [rendered, setRendered] = useState<React.ReactNode>(undefined)
    const isLoading = !isEquivalent(newProps, props)

    useEffect(() => {
      if (isLoading) {
        startTransition(async () => {
          // Need `as TProps` due to https://github.com/microsoft/TypeScript/issues/35858#issuecomment-573909154
          setRendered(await remoteComponent(newProps as TProps))
          setProps(newProps)
        })
      }
    }, [isLoading])

    return isLoading ? children : rendered
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
