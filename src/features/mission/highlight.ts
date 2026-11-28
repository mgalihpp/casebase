// Penyorot sintaks SQL untuk editor soal dan tampilan kode di berkas.

export type Token = { t: string; c: string; w: string };

const KATA_SQL =
  /^(SELECT|FROM|WHERE|ORDER|BY|GROUP|HAVING|LIMIT|DESC|ASC|AND|OR|JOIN|ON|AS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE)$/i;

export function highlight(code: string): Token[][] {
  return code.split("\n").map((line) => {
    const tokens: Token[] = [];
    const pattern = /('[^']*'?|"[^"]*"?|--.*$|\b\d+\b|[A-Za-z_][\w.]*|\s+|.)/g;
    let match: RegExpExecArray | null = pattern.exec(line);
    while (match !== null) {
      const text = match[0];
      let color = "#1E1B3A";
      let weight = "500";
      if (/^['"]/.test(text)) color = "#0E7490";
      else if (/^--/.test(text)) color = "#8B87A3";
      else if (/^\d+$/.test(text)) color = "#7C3AED";
      else if (KATA_SQL.test(text)) {
        color = "#4F46E5";
        weight = "700";
      } else if (/^[(){},;*]$/.test(text)) color = "#5C5878";
      const last = tokens[tokens.length - 1];
      if (last && last.c === color && last.w === weight) last.t += text;
      else tokens.push({ t: text, c: color, w: weight });
      match = pattern.exec(line);
    }
    return tokens;
  });
}
