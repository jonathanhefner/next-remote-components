import DynamicSelectClient from "@/components/DynamicSelectClient"
import MyClientComponent from "@/components/MyClientComponent"
import Typeahead from "@/components/Typeahead"

export default function Home() {
  return <>
    <h2>Basic Example</h2>
    <MyClientComponent />

    <hr />

    <h2>Dynamic Select</h2>
    <DynamicSelectClient />

    <hr />

    <h2>Typeahead</h2>
    <Typeahead />
  </>
}
