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
      key.startsWith("cruck_")
    );
    const f = keys.map((key) => key.replace("cruck_", ""));
    setFiles(f);
    if (f.length) {
      loadFile(f[0]);
    }
  }, []);

  const loadFile = (name: string) => {
    if (!name) return;
    const c = localStorage.getItem(`cruck_${name}`) || "";
    setActiveFile(name);
    setContent(c);
    setOutput("");
  };

  const saveFile = () => {
    if (!activeFile) {
      alert("Aucun fichier actif. Créez-en un d’abord.");
      return;
    }
    localStorage.setItem(`cruck_${activeFile}`, content);
  };

  const newFile = () => {
    const name = prompt("Nom du nouveau fichier (.cr) :");
    if (!name) return;
    localStorage.setItem(`cruck_${name}`, "");
    setFiles((prev) => [...prev, name]);
    loadFile(name);
  };

  const downloadFile = () => {
    if (!activeFile) {
      alert("Aucun fichier actif. Créez-en un d’abord.");
      return;
    }
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = activeFile;
    a.click();
  };

  const runCode = () => {
    if (!activeFile) {
      alert("Aucun fichier actif. Créez-en un d’abord.");
      return;
    }
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
          {activeFile ? (
            <>
              <Editor value={content} onChange={setContent} />
              <Console output={output} />
            </>
          ) : (
            <div className="no-file">
              <p>Aucun fichier ouvert. Veuillez créer ou ouvrir un fichier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
