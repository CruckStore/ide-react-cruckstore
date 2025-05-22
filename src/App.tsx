import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Console from "./components/Console";
import "./styles.scss";

const examples: { title: string; code: string }[] = [
  {
    title: "Hello World",
    code: 'print "Hello, CruckStore!";',
  },
  {
    title: "Boucle For",
    code: `func main() {
  var i = 0;
  while i < 5 {
    print "i = " + i;
    i = i + 1;
  }
}\nmain();`,
  },
  {
    title: "Condition",
    code: `func main() {
  var x = 10;
  if x > 5 {
    print "x est grand";
  } else {
    print "x est petit";
  }
}\nmain();`,
  },
];

const App: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("cruck_")
    );
    const f = keys.map((k) => k.replace("cruck_", ""));
    setFiles(f);
    if (f.length) loadFile(f[0]);
  }, []);

  const loadFile = (name: string) => {
    const c = localStorage.getItem(`cruck_${name}`) || "";
    setActiveFile(name);
    setContent(c);
    setOutput("");
  };

  const loadExample = (code: string) => {
    setActiveFile("");
    setContent(code);
    setOutput("");
  };

  // ... saveFile, newFile, downloadFile, runCode (inchangés)
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
      if (m) out += m[1] + "\n";
      else if (line.trim())
        out += `Erreur ligne ${idx + 1}: syntaxe inconnue\n`;
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
        <Sidebar
          files={files}
          activeFile={activeFile}
          examples={examples}
          onSelect={loadFile}
          onExample={loadExample}
        />
        <div className="workspace">
          {activeFile || content ? (
            <>
              <Editor value={content} onChange={setContent} />
              <Console output={output} />
            </>
          ) : (
            <div className="no-file">
              <p>
                Aucun fichier ouvert. Veuillez créer/ou sélectionner un fichier
                ou un exemple.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default App;
