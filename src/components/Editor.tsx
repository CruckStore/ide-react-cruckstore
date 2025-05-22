import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { autocompletion, acceptCompletion } from "@codemirror/autocomplete";
import { keymap } from "@codemirror/view";
import { linter } from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";

interface EditorProps {
  value: string;
  onChange: (v: string) => void;
  errors: { message: string; line: number; col: number }[];
}

function posFrom(line: number, col: number, doc: string): number {
  const lines = doc.split("\n");
  let pos = 0;
  for (let i = 0; i < line; i++) {
    pos += lines[i].length + 1;
  }
  return pos + col;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, errors }) => {
  const diagnostics: Diagnostic[] = errors.map(({ message, line, col }) => {
    const from = posFrom(line, col, value);
    const to = from + 1;
    return { from, to, severity: "error", message };
  });

  return (
    <div className="editor">
      <CodeMirror
        value={value}
        extensions={[
          javascript(),
          linter(() => diagnostics),
          autocompletion(),
          keymap.of([{ key: "Tab", run: acceptCompletion }]),
        ]}
        onChange={(v) => onChange(v)}
        editable={true}
        basicSetup={true}
        style={{ height: "100%", minHeight: "100%", overflowY: "auto" }}
      />
    </div>
  );
};

export default Editor;
