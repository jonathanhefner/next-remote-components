import { RemoteRef } from "@/lib/rrc-server"

export default async function MyServerComponent(
  { hello, repeat, children, ref }: {
    hello: string,
    repeat: number,
    children: React.ReactNode
    ref: RemoteRef<HTMLSpanElement>,
  }
) {
  return <>
    <p>
      {/* HACK Server-side React ignores (i.e. does not render) `ref` attribute, so use `data-ref` */}
      Hello <span data-ref={ref}>{hello}</span>, I am a remote server component with repeated client component children:
    </p>
    <ul>
      {Array(repeat).fill(<li key={null}>{children}</li>)}
    </ul>
  </>
}
