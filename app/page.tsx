import DynamicSelectClient from "@/components/DynamicSelectClient"
import MyClientComponent from "@/components/MyClientComponent"
import Typeahead from "@/components/Typeahead"

export default function Home() {
  return <>
    <MyClientComponent />
    <hr />
    <DynamicSelectClient />
    <hr />
    <Typeahead />
  </>
}
