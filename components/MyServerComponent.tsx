type TypeHack<T> = [never, T]
type RemoteForwardedRef<T> = "remote-component-element" | TypeHack<T>
type RemoteRefAttributes<T> = {} | TypeHack<T>

function remoteForwardRef<TProps, TRef, TReturn extends (JSX.Element | Promise<JSX.Element>)>(
  componentFn: (props: TProps, ref: RemoteForwardedRef<TRef>) => TReturn
): (props: TProps & RemoteRefAttributes<TRef>) => TReturn {
  return (props) => componentFn(props, "remote-component-element")
}

export const MyServerComponent = remoteForwardRef(async (
  { hello, children }: { hello: string, children: React.ReactNode },
  ref: RemoteForwardedRef<HTMLParagraphElement>,
) => {
  // HACK Server-side React ignores (i.e. does not render) `ref` attribute, so use `data-ref`
  return <p data-ref={ref}>Hello {hello}, I am a server component with children: {children}</p>
})
