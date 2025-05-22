import React from "react";

interface SidebarProps {
  files: string[];
  activeFile: string;
  examples: { title: string; code: string }[];
  onSelect: (name: string) => void;
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
        {files.map((file) => (
          <li
            key={file}
            className={file === activeFile ? "active" : ""}
            onClick={() => onSelect(file)}
          >
            {file}
          </li>
        ))}
      </ul>
    </section>
    <section>
      <h2>Exemples</h2>
      <ul>
        {examples.map((ex) => (
          <li key={ex.title} onClick={() => onExample(ex.code)}>
            {ex.title}
          </li>
        ))}
      </ul>
    </section>
    <section>
      <h2>Docs</h2>
      <ul>
        <li>
          <strong>print</strong> &mdash; Affiche du texte:{" "}
          <code>print "texte";</code>
        </li>
        <li>
          <strong>var</strong> &mdash; Déclare une variable:{" "}
          <code>var x = 1;</code>
        </li>
        <li>
          <strong>func</strong> &mdash; Déclare une fonction:{" "}
          <code>
            func nom() {"{"}...{"}"};
          </code>
        </li>
      </ul>
    </section>
  </aside>
);

export default Sidebar;
