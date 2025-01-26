import { createContext, memo, Suspense, use, useContext, useEffect, useId, useRef, useState } from "react";

export type RemoteComponent<TProps> = (props: TProps) => Promise<React.ReactNode>

type PromiseCacheEntry = {
  promise: Promise<React.ReactNode>,
  props: object,
}

type RemoteContextValue = {
  promiseCache: PromiseCacheEntry[],
  promiseCoordinator: PromiseWithResolvers<void>,
}

const RemoteContext = createContext<RemoteContextValue | null>(null)

const ChildrenSlotContext = createContext<React.ReactNode | undefined>(undefined)

export function remote<TProps extends object>(
  remoteComponent: RemoteComponent<TProps>
): React.FunctionComponent<TProps> {
  const MemoizedComponent = memo((props: TProps) => use(getPromise(remoteComponent, props)))

  return (props: React.PropsWithChildren<TProps>) => {
    const children = props.children
    if ("children" in props) {
      props = { ...props, children: true }
    }

    return (
      <ChildrenSlotContext.Provider value={children}>
        <MemoizedComponent {...props} />
      </ChildrenSlotContext.Provider>
    )
  }
}

function ChildrenSlot() {
  const children = useContext(ChildrenSlotContext)
  return children
}

function getPromise<TProps extends object>(
  remoteComponent: RemoteComponent<TProps>,
  props: TProps,
): Promise<React.ReactNode> {
  const context = useContext(RemoteContext)
  if (!context) throw new Error("Remote component must be wrapped in RemoteSuspense boundary")

  const id = useId()

  let cacheEntry = context.promiseCache.find(cacheEntry => isEquivalent(props, cacheEntry.props))

  if (!cacheEntry) {
    const remoteProps = "children" in props
      ? { ...props, children: <ChildrenSlot key={`${id}-children`} /> }
      : props

    cacheEntry = {
      // TODO After https://github.com/vercel/next.js/issues/75374 is fixed,
      // remove `promiseCoordinator` and call server function directly.
      promise: context.promiseCoordinator.promise.then(() => remoteComponent(remoteProps)),
      props: props,
    }

    context.promiseCache.push(cacheEntry)
  }

  return cacheEntry.promise
}

function isEquivalent(object1: object, object2: object) {
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

export function RemoteSuspense({ fallback, children }: {
  fallback?: React.ReactNode,
  children?: React.ReactNode | undefined,
}) {
  const contextStateRef = useRef<RemoteContextValue>({
    promiseCache: [],
    promiseCoordinator: Promise.withResolvers(),
  })

  // Avoid server function calls during SSR and hydration errors during CSR
  //
  // TODO After https://github.com/vercel/next.js/issues/53987 is fixed, simply
  // throw Error in `getPromise` when `window` is undefined.
  const [isFirstRender, setIsFirstRender] = useState(true)
  useEffect(() => { setIsFirstRender(false) }, [])
  if (isFirstRender) return fallback

  return (
    <RemoteContext.Provider value={contextStateRef.current}>
      <Suspense fallback={<RemoteManager fallback={fallback} />}>
        {children}
      </Suspense>
    </RemoteContext.Provider>
  )
}

function RemoteManager({ fallback }: {
  fallback: React.ReactNode
}) {
  const context = useContext(RemoteContext)!

  useEffect(() => {
    context.promiseCoordinator.resolve()

    return () => {
      context.promiseCache = []
      context.promiseCoordinator = Promise.withResolvers()
    }
  }, [context])

  return fallback
}
