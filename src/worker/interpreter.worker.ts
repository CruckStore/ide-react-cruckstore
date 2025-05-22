export type MessageToWorker = { type: "run"; code: string };
export type MessageFromWorker =
  | { type: "output"; lines: string[] }
  | { type: "error"; message: string; line: number; col: number };

const ctx: Worker = self as any;

function reportPosition(rawLines: string[], line: number, col: number) {
  return { line, col };
}

function evalOperand(
  token: string,
  vars: Record<string, number>,
  pos: { line: number; col: number }
) {
  if (/^\d+$/.test(token)) return Number(token);
  if (token in vars) return vars[token];
  throw { message: `Variable non déclarée: ${token}`, ...pos };
}

ctx.addEventListener("message", (ev: MessageEvent<MessageToWorker>) => {
  if (ev.data.type !== "run") return;
  const code = ev.data.code;
  const rawLines = code.split("\n");
  const vars: Record<string, number> = {};
  const outputLines: string[] = [];

  try {
    let depth = 0;
    rawLines.forEach((line, idx) => {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "{") depth++;
        if (line[i] === "}") {
          depth--;
          if (depth < 0)
            throw {
              message: "Accolade fermante inattendue",
              line: idx,
              col: i,
            };
        }
      }
    });
    if (depth !== 0) {
      const last = rawLines.length - 1;
      throw {
        message: "Accolade non équilibrées dans le code",
        line: last,
        col: rawLines[last].length,
      };
    }

    const lines = rawLines.map((l) => l.trim());

    const mainStart = lines.findIndex((l) =>
      /^func\s+main\s*\(\)\s*\{/.test(l)
    );
    let execLines: string[];
    let offset = 0;

    if (mainStart >= 0) {
      let brace = 0;
      let end = -1;
      for (let i = mainStart; i < lines.length; i++) {
        if (lines[i].endsWith("{")) brace++;
        if (lines[i] === "}") brace--;
        if (brace === 0) {
          end = i;
          break;
        }
      }
      if (end < 0)
        throw {
          message: "Fonction main non fermée correctement",
          ...reportPosition(rawLines, mainStart, 0),
        };
      execLines = lines.slice(mainStart + 1, end);
      offset = mainStart + 1;
    } else {
      execLines = lines;
      offset = 0;
    }

    function execBlock(block: string[], base: number) {
      let ip = 0;
      while (ip < block.length) {
        const raw = block[ip];
        const lineNum = base + ip;

        if (!raw || raw.startsWith("//")) {
          ip++;
          continue;
        }

        let m = raw.match(/^print\s+"([^"]*)"(?:\s*\+\s*(\w+))?\s*;$/);
        if (m) {
          const [, txt, varname] = m;
          if (varname) {
            const value = evalOperand(
              varname,
              vars,
              reportPosition(rawLines, lineNum, raw.indexOf(varname))
            );
            outputLines.push(txt + value);
          } else {
            outputLines.push(txt);
          }
          ip++;
          continue;
        }

        // var x = expr;
        m = raw.match(/^var\s+(\w+)\s*=\s*(\d+|\w+)\s*;$/);
        if (m) {
          const [, name, expr] = m;
          vars[name] = evalOperand(
            expr,
            vars,
            reportPosition(rawLines, lineNum, raw.indexOf(expr))
          );
          ip++;
          continue;
        }

        // x = y + z;
        m = raw.match(/^(\w+)\s*=\s*(\w+)\s*\+\s*(\w+)\s*;$/);
        if (m) {
          const [, dest, op1, op2] = m;
          const val1 = evalOperand(
            op1,
            vars,
            reportPosition(rawLines, lineNum, raw.indexOf(op1))
          );
          const val2 = evalOperand(
            op2,
            vars,
            reportPosition(rawLines, lineNum, raw.indexOf(op2))
          );
          vars[dest] = val1 + val2;
          ip++;
          continue;
        }

        // while cond {
        m = raw.match(/^while\s+(\w+)\s*<\s*(\d+)\s*\{$/);
        if (m) {
          const [, v, lim] = m;
          if (!(v in vars))
            throw {
              message: `Variable non déclarée: ${v}`,
              ...reportPosition(rawLines, lineNum, raw.indexOf(v)),
            };
          // collect inner block
          const inner: string[] = [];
          let d = 1,
            j = ip + 1;
          while (j < block.length && d > 0) {
            if (block[j].endsWith("{")) d++;
            if (block[j] === "}") d--;
            if (d > 0) inner.push(block[j]);
            j++;
          }
          while (vars[v] < Number(lim)) execBlock(inner, base + ip + 1);
          ip = j;
          continue;
        }

        // if cond {
        m = raw.match(/^if\s+(\w+)\s*([><=!]+)\s*(\d+)\s*\{$/);
        if (m) {
          const [, v, op, num] = m;
          if (!(v in vars))
            throw {
              message: `Variable non déclarée: ${v}`,
              ...reportPosition(rawLines, lineNum, raw.indexOf(v)),
            };
          // collect if block
          const ifBlock: string[] = [];
          let d = 1,
            j = ip + 1;
          while (j < block.length && d > 0) {
            if (block[j].endsWith("{")) d++;
            if (block[j] === "}") d--;
            if (d > 0) ifBlock.push(block[j]);
            j++;
          }
          // check next else
          let elseBlock: string[] = [];
          if (block[j] && /^else\s*\{$/.test(block[j])) {
            d = 1;
            j++;
            while (j < block.length && d > 0) {
              if (block[j].endsWith("{")) d++;
              if (block[j] === "}") d--;
              if (d > 0) elseBlock.push(block[j]);
              j++;
            }
          }

          // evaluate condition
          const left = vars[v];
          const right = Number(num);
          const cond =
            op === ">"
              ? left > right
              : op === "<"
              ? left < right
              : op === "=="
              ? left === right
              : op === "!="
              ? left !== right
              : false;
          if (cond) execBlock(ifBlock, base + ip + 1);
          else if (elseBlock.length)
            execBlock(elseBlock, base + ip + 1 + ifBlock.length + 2);
          ip = j;
          continue;
        }

        // any other, skip
        ip++;
      }
    }

    execBlock(execLines, offset);
    ctx.postMessage({ type: "output", lines: outputLines });
  } catch (err: any) {
    const e =
      err && typeof err === "object" && "message" in err
        ? err
        : { message: String(err), line: 0, col: 0 };
    ctx.postMessage({
      type: "error",
      message: e.message,
      line: e.line,
      col: e.col,
    });
  }
});
