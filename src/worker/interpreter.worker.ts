export type MessageToWorker = { type: 'run'; code: string };
export type MessageFromWorker =
  | { type: 'output'; lines: string[] }
  | { type: 'error'; message: string; line: number; col: number };

const ctx: Worker = self as any;

ctx.addEventListener('message', (ev: MessageEvent<MessageToWorker>) => {
  if (ev.data.type === 'run') {
    const code = ev.data.code;
    const lines = code.split('\n').map(l => l.trim());
    const vars: Record<string, number> = {};
    const outputLines: string[] = [];

    try {

        lines.forEach((line, idx) => {

        if (line.startsWith('print') && !/;?\s*$/.test(line)) {
          throw { message: 'Point-virgule manquant', line: idx, col: line.length };
        }
        const m = line.match(/^print\s+"([^"]*)"\s*;?$/);
        if (m) {
          outputLines.push(m[1]);
        }

    });

      ctx.postMessage({ type: 'output', lines: outputLines });
    } catch (err: any) {
      const e = typeof err === 'object' && err.line != null
        ? err
        : { message: err.toString(), line: 0, col: 0 };
      ctx.postMessage({
        type: 'error',
        message: e.message,
        line: e.line,
        col: e.col
      });
    }
  }
});
