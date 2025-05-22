export type MessageToWorker = { type: "run"; code: string };
export type MessageFromWorker =
  | { type: "output"; lines: string[] }
  | { type: "error"; message: string; line: number; col: number };

const ctx: Worker = self as any;

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
          if (depth < 0) {
            throw {
              message: "Accolade fermante inattendue",
              line: idx,
              col: i,
            };
          }
        }
      }
    });
    if (depth > 0) {
      const lastLine = rawLines.length - 1;
      throw {
        message: "Accolade fermante manquante",
        line: lastLine,
        col: rawLines[lastLine].length,
      };
    }

    const lines = rawLines.map((l) => l.trim());
    const start = lines.findIndex((l) => l.startsWith("func main"));
    if (start === -1) {
      throw { message: "Fonction main introuvable", line: 0, col: 0 };
    }
    const end = lines.findIndex((l, i) => i > start && l === "}");
    if (end === -1) {
      throw {
        message: "Accolade fermante de main manquante",
        line: start,
        col: 0,
      };
    }
    const body = lines.slice(start + 1, end);

    const execBlock = (block: string[]) => {
      let ip = 0;
      while (ip < block.length) {
        const line = block[ip].trim();
        let m;

        m = line.match(/^var\s+(\w+)\s*=\s*(\d+)\s*;?$/);
        if (m) {
          vars[m[1]] = Number(m[2]);
          ip++;
          continue;
        }

        m = line.match(/^(\w+)\s*=\s*(\w+)\s*\+\s*(\d+)\s*;?$/);
        if (m) {
          const [, dest, src, inc] = m;
          if (!(src in vars)) {
            throw {
              message: `Variable non déclarée: ${src}`,
              line: ip + start + 1,
              col: 0,
            };
          }
          vars[dest] = (vars[src] ?? 0) + Number(inc);
          ip++;
          continue;
        }

        m = line.match(/^while\s+(\w+)\s*<\s*(\d+)\s*{?$/);
        if (m) {
          const [, v, lim] = m;
          if (!(v in vars)) {
            throw {
              message: `Variable non déclarée: ${v}`,
              line: ip + start + 1,
              col: 0,
            };
          }

          const inner: string[] = [];
          let depth = 1;
          let j = ip + 1;
          while (j < block.length && depth > 0) {
            if (block[j].endsWith("{")) depth++;
            if (block[j] === "}") depth--;
            if (depth > 0) inner.push(block[j]);
            j++;
          }
          while ((vars[v] ?? 0) < Number(lim)) {
            execBlock(inner);
          }
          ip = j;
          continue;
        }

        m = line.match(/^print\s+"([^"]*)"\s*;?$/);
        if (m) {
          outputLines.push(m[1]);
          ip++;
          continue;
        }

        m = line.match(/^print\s+"([^"]*)"\s*\+\s*(\w+)\s*;?$/);
        if (m) {
          const [, txt, v] = m;
          if (!(v in vars)) {
            throw {
              message: `Variable non déclarée: ${v}`,
              line: ip + start + 1,
              col: 0,
            };
          }
          outputLines.push(txt + (vars[v] ?? 0));
          ip++;
          continue;
        }

        if (line.startsWith("print") && !/;\s*$/.test(rawLines[ip])) {
          throw {
            message: "Point-virgule manquant",
            line: ip + 1,
            col: rawLines[ip].length,
          };
        }

        ip++;
      }
    };

    execBlock(body);
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
