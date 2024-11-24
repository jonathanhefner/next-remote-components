import myRemoteComponents from "@/components/my-remote-components"
import { serveRemoteComponents } from "@/lib/rrc-server"

export const GET = serveRemoteComponents(myRemoteComponents)
