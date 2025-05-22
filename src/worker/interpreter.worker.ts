export type MessageToWorker = { type: "run"; code: string };
export type MessageFromWorker =
  | { type: "output"; lines: string[] }
  | { type: "error"; message: string; line: number; col: number };

const ctx: Worker = self as any;

function reportPosition(line: number, col: number) {
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

// Parse and execute code upon message
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
              ...reportPosition(idx, i),
            };
        }
      }
    });
    if (depth !== 0) {
      const last = rawLines.length - 1;
      throw {
        message: "Accolades non équilibrées dans le code",
        ...reportPosition(last, rawLines[last].length),
      };
    }

    const lines = rawLines.map((l) => l.trim());

    const mainStart = lines.findIndex((l) =>
      /^func\s+main\s*\(\)\s*\{/.test(l)
    );
    let execLines: string[];
    let offset = 0;

    if (mainStart >= 0) {
      let braceCount = 0;
      let end = -1;
      for (let i = mainStart; i < rawLines.length; i++) {
        for (const ch of rawLines[i]) {
          if (ch === "{") braceCount++;
          else if (ch === "}") braceCount--;
        }
        if (braceCount === 0) {
          end = i;
          break;
        }
      }
      if (end < 0)
        throw {
          message: "Fonction main non fermée",
          ...reportPosition(mainStart, rawLines[mainStart].indexOf("{")),
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

        // PRINT
        let m = raw.match(/^print\s+"([^"]*)"(?:\s*\+\s*(\w+))?\s*;$/);
        if (m) {
          const [, txt, varname] = m;
          if (varname) {
            const col = raw.indexOf(varname);
            const pos = reportPosition(lineNum, col);
            const value = evalOperand(varname, vars, pos);
            outputLines.push(txt + value);
          } else {
            outputLines.push(txt);
          }
          ip++;
          continue;
        }

        // VAR
        m = raw.match(/^var\s+(\w+)\s*=\s*(\w+|\d+)\s*;$/);
        if (m) {
          const [, name, expr] = m;
          const col = raw.indexOf(expr);
          const pos = reportPosition(lineNum, col);
          vars[name] = evalOperand(expr, vars, pos);
          ip++;
          continue;
        }

        // ASSIGN
        m = raw.match(/^(\w+)\s*=\s*(\w+)\s*\+\s*(\w+)\s*;$/);
        if (m) {
          const [, dest, op1, op2] = m;
          const pos1 = reportPosition(lineNum, raw.indexOf(op1));
          const pos2 = reportPosition(lineNum, raw.indexOf(op2));
          const val1 = evalOperand(op1, vars, pos1);
          const val2 = evalOperand(op2, vars, pos2);
          vars[dest] = val1 + val2;
          ip++;
          continue;
        }

        // WHILE
        m = raw.match(/^while\s+(\w+)\s*<\s*(\d+)\s*\{$/);
        if (m) {
          const [, v, lim] = m;
          const col = raw.indexOf(v);
          if (!(v in vars))
            throw {
              message: `Variable non déclarée: ${v}`,
              ...reportPosition(lineNum, col),
            };
          const inner: string[] = [];
          let depth = 1;
          let j = ip + 1;
          while (j < block.length && depth > 0) {
            if (block[j].endsWith("{")) depth++;
            if (block[j] === "}") depth--;
            if (depth > 0) inner.push(block[j]);
            j++;
          }
          while ((vars[v] ?? 0) < Number(lim)) execBlock(inner, base + ip + 1);
          ip = j;
          continue;
        }

        m = raw.match(/^if\s+(\w+)\s*(==|!=|>=|<=|>|<)\s*(\d+)\s*\{$/);
        if (m) {
          const [, v, op, num] = m;
          const col = raw.indexOf(v);
          if (!(v in vars))
            throw {
              message: `Variable non déclarée: ${v}`,
              ...reportPosition(lineNum, col),
            };
          const ifBlock: string[] = [];
          let depth = 1;
          let j = ip + 1;
          while (j < block.length && depth > 0) {
            if (block[j].endsWith("{")) depth++;
            if (block[j] === "}") depth--;
            if (depth > 0) ifBlock.push(block[j]);
            j++;
          }
          let elseBlock: string[] = [];
          if (/^else\s*\{$/.test(block[j])) {
            depth = 1;
            j++;
            while (j < block.length && depth > 0) {
              if (block[j].endsWith("{")) depth++;
              if (block[j] === "}") depth--;
              if (depth > 0) elseBlock.push(block[j]);
              j++;
            }
          }
          const left = vars[v];
          const right = Number(num);
          let cond = false;
          switch (op) {
            case "==":
              cond = left === right;
              break;
            case "!=":
              cond = left !== right;
              break;
            case ">=":
              cond = left >= right;
              break;
            case "<=":
              cond = left <= right;
              break;
            case ">":
              cond = left > right;
              break;
            case "<":
              cond = left < right;
              break;
          }
          if (cond) execBlock(ifBlock, base + ip + 1);
          else if (elseBlock.length)
            execBlock(elseBlock, base + ip + 1 + ifBlock.length + 2);
          ip = j;
          continue;
        }

        if (/^func\s+\w+\s*\(/.test(raw)) {
          throw {
            message: `Fonctions autres que main non supportées: '${raw}'`,
            ...reportPosition(lineNum, 0),
          };
        }

        if (!raw.endsWith(";") && !raw.endsWith("{") && !raw.startsWith("}")) {
          throw {
            message: `Point-virgule manquant ou syntaxe incorrecte`,
            ...reportPosition(lineNum, raw.length),
          };
        }

        throw {
          message: `Instruction inconnue ou syntaxe invalide: '${raw}'`,
          ...reportPosition(lineNum, 0),
        };
      }
    }

    execBlock(execLines, offset);
    ctx.postMessage({ type: "output", lines: outputLines });
  } catch (err: any) {
    const e =
      err && err.message ? err : { message: String(err), line: 0, col: 0 };
    ctx.postMessage({
      type: "error",
      message: e.message,
      line: e.line,
      col: e.col,
    });
  }
});
