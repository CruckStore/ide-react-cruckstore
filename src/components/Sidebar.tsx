import React from "react";

interface SidebarProps {
  files: string[];
  activeFile: string;
  examples: { title: string; code: string }[];
  onSelect: (n: string) => void;
  onExample: (code: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFile,
  examples,
  onSelect,
  onExample,
}) => (
  <aside className="sidebar">
    <section>
      <h2>Fichiers</h2>
      <ul>
        {files.map((f) => (
          <li
            key={f}
            className={f === activeFile ? "active" : ""}
            onClick={() => onSelect(f)}
          >
            {f}
          </li>
        ))}
      </ul>
    </section>
    <section>
      <h2>Exemples</h2>
      <ul>
        {examples.map((e) => (
          <li key={e.title} onClick={() => onExample(e.code)}>
            {e.title}
          </li>
        ))}
      </ul>
    </section>
    <section>
      <h2>Docs</h2>
      <ul>
        <li>
          <strong>print</strong>: <code>print "texte";</code>
        </li>
        <li>
          <strong>var</strong>: <code>var x = 1;</code>
        </li>
        <li>
          <strong>func</strong>:{" "}
          <code>
            func nom() {"{"}...{"}"};
          </code>
        </li>
      </ul>
    </section>
  </aside>
);

export default Sidebar;
