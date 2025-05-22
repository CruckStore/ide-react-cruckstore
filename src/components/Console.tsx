import React from "react";

interface ConsoleProps {
  output: string;
  errors: { message: string; line: number; col: number }[];
}

const Console: React.FC<ConsoleProps> = ({ output, errors }) => (
  <div className="console">
    {errors.length > 0 ? (
      <ul className="errors">
        {errors.map((e, i) => (
          <li key={i}>
            L{e.line + 1} : C{e.col + 1} – {e.message}
          </li>
        ))}
      </ul>
    ) : (
      <pre>{output}</pre>
    )}
  </div>
);

export default Console;
