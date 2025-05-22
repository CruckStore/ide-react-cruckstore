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
    if (!content.trim()) {
      alert("Aucun code à exécuter. Créez ou chargez du contenu.");
      return;
    }
    const lines = content.split("\n").map((l) => l.trim());
    const vars: Record<string, number> = {};
    let output = "";

    const startMain = lines.findIndex((l) => l.startsWith("func main"));
    const endMain = lines.lastIndexOf("}");
    if (startMain === -1 || endMain === -1) {
      alert("Pas de fonction main() valide trouvée.");
      setOutput("");
      return;
    }
    const body = lines.slice(startMain + 1, endMain);

    const execBlock = (block: string[]) => {
      let i = 0;
      while (i < block.length) {
        const line = block[i];

        let m = line.match(/^var\s+(\w+)\s*=\s*(\d+)\s*;?$/);
        if (m) {
          vars[m[1]] = Number(m[2]);
          i++;
          continue;
        }

        m = line.match(/^print\s+"([^"]*)"\s*\+\s*(\w+)\s*;?$/);
        if (m) {
          const [_, txt, v] = m;
          const val = vars[v] ?? 0;
          output += txt + val + "\n";
          i++;
          continue;
        }

        m = line.match(/^while\s+(\w+)\s*<\s*(\d+)\s*{\s*$/);
        if (m) {
          const [_w, v, lim] = m;
          const limN = Number(lim);

          const blockInner: string[] = [];
          let depth = 1;
          let j = i + 1;
          while (j < block.length && depth > 0) {
            if (block[j].endsWith("{")) depth++;
            if (block[j] === "}") depth--;
            if (depth > 0) blockInner.push(block[j]);
            j++;
          }

          while ((vars[v] ?? 0) < limN) {
            execBlock(blockInner);
          }

          i = j;
          continue;
        }

        i++;
      }
    };

    execBlock(body);
    setOutput(output);
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
