import { RemoteForwardedRef, remoteForwardRef } from "@/lib/rrc-server"

export const MyServerComponent = remoteForwardRef(async (
  { hello, children }: { hello: string, children: React.ReactNode },
  ref: RemoteForwardedRef<HTMLParagraphElement>,
) => {
  // HACK Server-side React ignores (i.e. does not render) `ref` attribute, so use `data-ref`
  return <p data-ref={ref}>Hello {hello}, I am a server component with children: {children}</p>
})
