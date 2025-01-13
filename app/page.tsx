import DynamicSelect from "@/components/DynamicSelect"
import Typeahead from "@/components/Typeahead"
import "./page.css"

export default function Home() {
  return <>
    <section className="typeahead">
      <h2>Typeahead</h2>
      <p>
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/Typeahead.tsx">client <code>.tsx</code></a>{" | "}
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/Typeahead.server.tsx">server <code>.tsx</code></a>
      </p>
      <div className="demo"><Typeahead /></div>
    </section>

    <section className="dynamic-select">
      <h2>Dynamic Select</h2>
      <p>
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/DynamicSelect.tsx">client <code>.tsx</code></a>{" | "}
        <a target="_blank" href="https://github.com/jonathanhefner/next-remote-components/blob/main/components/DynamicSelect.server.tsx">server <code>.tsx</code></a>
      </p>
      <div className="demo"><DynamicSelect /></div>
    </section>
  </>
}
