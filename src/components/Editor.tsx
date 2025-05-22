import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';

interface EditorProps {
  value: string;
  onChange: (v: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => (
  <div className="editor">
    <CodeMirror
      value={value}
      extensions={[
        javascript(),
        autocompletion(),
        keymap.of([
          { key: 'Tab', run: acceptCompletion }
        ])
      ]}
      onChange={v => onChange(v)}
      editable={true}
      basicSetup={true}
      style={{ height: '100%', minHeight: '100%', overflowY: 'auto' }}
    />
  </div>
);

export default Editor;
