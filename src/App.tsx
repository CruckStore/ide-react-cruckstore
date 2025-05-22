import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Console from "./components/Console";
import "./styles.scss";

const App: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("cr_")
    );
    const f = keys.map((key) => key.replace("cr_", ""));
    setFiles(f);
    if (f.length && !activeFile) loadFile(f[0]);
  }, []);

  const loadFile = (name: string) => {
    const c = localStorage.getItem(`cr_${name}`) || "";
    setActiveFile(name);
    setContent(c);
    setOutput("");
  };

  const saveFile = () => {
    if (!activeFile) return;
    localStorage.setItem(`cr_${activeFile}`, content);
  };

  const newFile = () => {
    const name = prompt("Nom du nouveau fichier (.cr) :");
    if (!name) return;
    localStorage.setItem(`cr_${name}`, "");
    setFiles((prev) => [...prev, name]);
    loadFile(name);
  };

  const downloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = activeFile;
    a.click();
  };

  const runCode = () => {
    const lines = content.split("\n");
    let out = "";
    lines.forEach((line, idx) => {
      const m = line.match(/^print\s+"(.+)"\s*;?$/);
      if (m) {
        out += m[1] + "\n";
      } else if (line.trim() !== "") {
        out += `Erreur ligne ${idx + 1}: syntaxe inconnue\n`;
      }
    });
    setOutput(out);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>CruckStore IDE</h1>
        <div className="toolbar">
          <button onClick={newFile}>Nouveau</button>
          <button onClick={() => loadFile(activeFile)}>Ouvrir</button>
          <button onClick={saveFile}>Enregistrer</button>
          <button onClick={downloadFile}>Télécharger</button>
          <button onClick={runCode}>Exécuter</button>
        </div>
      </header>
      <div className="main">
        <Sidebar files={files} activeFile={activeFile} onSelect={loadFile} />
        <div className="workspace">
          <Editor value={content} onChange={setContent} />
          <Console output={output} />
        </div>
      </div>
    </div>
  );
};

export default App;
