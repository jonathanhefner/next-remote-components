export default async function MyServerComponent({
  hello,
  children,
}: {
  hello: string,
  children: React.ReactNode,
}) {
  return <p>Hello {hello}, I am a server component with children: {children}</p>
}
