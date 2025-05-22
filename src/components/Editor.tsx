import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

interface EditorProps {
  value: string;
  onChange: (v: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => (
  <div className="editor">
    <CodeMirror
      value={value}
      extensions={[javascript()]}
      onChange={(v) => onChange(v)}
      editable={true}
      height="100%"
      basicSetup={true}
    />
  </div>
);

export default Editor;
