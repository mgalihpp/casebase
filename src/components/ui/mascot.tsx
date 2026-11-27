import { MASCOT_SVG, type MascotKind } from "./mascot-art";

// The eight expressions from the design. Each one is driven by the CSS in mascot.css.
export type MascotMood =
  | "idle"
  | "wave"
  | "think"
  | "happy"
  | "sad"
  | "shock"
  | "sleep"
  | "celebrate";

const KIND_BY_NAME: Record<string, MascotKind> = {
  Dibi: "sql",
  Pogi: "pg",
  Doku: "mongo",
  Kubo: "redis",
  Pena: "lite",
};

type MascotProps = {
  name: string;
  size?: number;
  mood?: MascotMood;
  className?: string;
};

export function Mascot({
  name,
  size = 80,
  mood = "idle",
  className,
}: MascotProps) {
  const kind = KIND_BY_NAME[name] ?? "sql";
  const svg = MASCOT_SVG[kind]
    .replace("__CLS__", `mk mood-${mood}`)
    .replace(/__SIZE__/g, String(size));

  return (
    <span
      className={`inline-block shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the art is a fixed SVG from the design, not user input.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
