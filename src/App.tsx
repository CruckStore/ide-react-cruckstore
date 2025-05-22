import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Console from "./components/Console";
import "./styles.scss";

const examples: { title: string; code: string }[] = [
  { title: "Hello World", code: 'print "Hello, CruckStore!";' },
  {
    title: "Boucle For",
    code: `func main() {
  var i = 0;
  while i < 5 {
    print "i = " + i;
    i = i + 1;
  }
}
main();`,
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
}
main();`,
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
    if (!content.trim()) {
      alert("Aucun code à exécuter.");
      return;
    }
    const lines = content.split("\n").map((l) => l.trim());
    const vars: Record<string, number> = {};
    const outputLines: string[] = [];

    lines.forEach((line) => {
      const p = line.match(/^print\s+"([^"]*)"\s*;?$/);
      if (p) outputLines.push(p[1]);
    });

    const start = lines.findIndex((l) => l.startsWith("func main"));
    if (start !== -1) {
      const end = lines.findIndex((l, i) => i > start && l === "}");
      if (end !== -1) {
        const body = lines.slice(start + 1, end);
        const execBlock = (block: string[]) => {
          let ip = 0;
          while (ip < block.length) {
            const line = block[ip];
            let m: RegExpMatchArray | null;

            m = line.match(/^var\s+(\w+)\s*=\s*(\d+)\s*;?$/);
            if (m) {
              vars[m[1]] = Number(m[2]);
              ip++;
              continue;
            }

            m = line.match(/^(\w+)\s*=\s*(\w+)\s*\+\s*(\d+)\s*;?$/);
            if (m) {
              const [, dest, src, inc] = m;
              vars[dest] = (vars[src] ?? 0) + Number(inc);
              ip++;
              continue;
            }

            m = line.match(/^while\s+(\w+)\s*<\s*(\d+)\s*{\s*$/);
            if (m) {
              const [, v, lim] = m;
              const inner: string[] = [];
              let depth = 1,
                j = ip + 1;
              while (j < block.length && depth > 0) {
                if (block[j].endsWith("{")) depth++;
                if (block[j] === "}") depth--;
                if (depth > 0) inner.push(block[j]);
                j++;
              }
              while ((vars[v] ?? 0) < Number(lim)) execBlock(inner);
              ip = j;
              continue;
            }

            m = line.match(/^print\s+"([^\"]*)"\s*\+\s*(\w+)\s*;?$/);
            if (m) {
              const [, txt, v] = m;
              outputLines.push(txt + (vars[v] ?? 0));
              ip++;
              continue;
            }

            ip++;
          }
        };
        execBlock(body);
      }
    }
    
    setOutput(outputLines.join("\n"));
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
