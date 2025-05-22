import React from "react";

interface SidebarProps {
  files: string[];
  activeFile: string;
  onSelect: (name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ files, activeFile, onSelect }) => (
  <aside className="sidebar">
    <ul>
      {files.map((file) => (
        <li
          key={file}
          className={file === activeFile ? "active" : ""}
          onClick={() => onSelect(file)}
        >
          {file}
        </li>
      ))}
    </ul>
  </aside>
);

export default Sidebar;
