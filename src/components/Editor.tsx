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
      editable={true}
      onChange={v => onChange(v)}
      basicSetup={true}
      style={{ height: '100%', minHeight: '100%' }}
    />
  </div>
);

export default Editor;
