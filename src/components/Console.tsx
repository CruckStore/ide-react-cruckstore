import React from "react";

interface ConsoleProps {
  output: string;
}

const Console: React.FC<ConsoleProps> = ({ output }) => (
  <div className="console">
    <pre>{output}</pre>
  </div>
);

export default Console;
