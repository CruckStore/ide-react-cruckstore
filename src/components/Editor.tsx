import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => (
  <div className="editor">
    <CodeMirror
      value={value}
      extensions={[javascript()]}
      onChange={(value) => onChange(value)}
      height="100%"
    />
  </div>
);

export default Editor;
