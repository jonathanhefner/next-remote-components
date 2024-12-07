import DynamicSelectClient from "@/components/DynamicSelectClient"
import MyClientComponent from "@/components/MyClientComponent"
import Typeahead from "@/components/Typeahead"
import "./page.css"

export default function Home() {
  return <>
    <section className="basic-example">
      <h2>Basic Example</h2>
      <p>
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/MyServerComponent.tsx">Server Component</a>{" | "}
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/MyClientComponent.tsx">Client Component</a>
      </p>
      <div className="demo"><MyClientComponent /></div>
    </section>

    <section className="dynamic-select">
      <h2>Dynamic Select + Suspense</h2>
      <p>
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/DynamicSelectServer.tsx">Server Component</a>{" | "}
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/DynamicSelectClient.tsx">Client Component</a>
      </p>
      <div className="demo"><DynamicSelectClient /></div>
    </section>

    <section className="typeahead">
      <h2>Typeahead</h2>
      <p>
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/TypeaheadSuggestions.tsx">Server Component</a>{" | "}
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/Typeahead.tsx">Client Component</a>
      </p>
      <div className="demo"><Typeahead /></div>
    </section>
  </>
}
