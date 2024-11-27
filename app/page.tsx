import DynamicSelectClient from "@/components/DynamicSelectClient"
import MyClientComponent from "@/components/MyClientComponent"
import Typeahead from "@/components/Typeahead"
import "./page.css"

export default function Home() {
  return <>
    <section className="basic-example">
      <h2>Basic Example</h2>
      <div><MyClientComponent /></div>
    </section>

    <section className="dynamic-select">
      <h2>Dynamic Select + Suspense</h2>
      <div><DynamicSelectClient /></div>
    </section>

    <section className="typeahead">
      <h2>Typeahead</h2>
      <div><Typeahead /></div>
    </section>
  </>
}
