"use client";

import { type CSSProperties, useState } from "react";
import "./gift-chest.css";

const PALETTE: Record<string, string> = {
  K: "#3B2350",
  R: "#EF4444",
  L: "#F87171",
  T: "#FCA5A5",
  D: "#B91C1C",
  F: "#DC2626",
  S: "#991B1B",
  Y: "#FBBF24",
  O: "#D97706",
  I: "#5B1220",
  C: "#FBBF24",
  c: "#F59E0B",
  W: "#FEF3C7",
};

const BODY = [
  "....KKKKKKKKKKKKKK",
  "...KIIIIIIIIIIIIKK",
  "..KIIIIIIIIIIIIKDK",
  ".KIIIIIIIIIIIIKDDK",
  "KKKKKKKKKKKKKKDDDK",
  "KLRRRRYYRRRRRKDODK",
  "KLRRRRYYRRRRRKDODK",
  "KLRRRRYYRRRRRKDODK",
  "KLRRRRYYRRRRRKDODK",
  "KLRRRRYYRRRRRKDODK",
  "KLRRRRYYRRRRRKDOK.",
  "KLRRRRYYRRRRRKDK..",
  "KLRRRRYYRRRRRKK...",
  "KKKKKKKKKKKKKK....",
];

const LID = [
  "....KKKKKKKKKKKKKKKK",
  "...KTTTTTTYYTTTTTTKK",
  "..KYYYYYYYYYYYYYYKSK",
  ".KTTTTTTYYTTTTTTKOSK",
  "KKKKKKKKKKKKKKKKSOK.",
  "KFFFFFFYYFFFFFFKSK..",
  "KFFFFFFYYFFFFFFKK...",
  "KKKKKKKKKKKKKKKK....",
];

const BOW = [
  ".KKK..KKK.",
  "KYYYKKYYYK",
  "KYOOYYOOYK",
  ".KKKYYKKK.",
  "....KK....",
];

const COIN = [".KKK.", "KCWCK", "KCCcK", "KCcCK", ".KKK."];

const SPARKS = [
  { x: 6, y: 12, dx: -5, dy: -6, delay: 0.32 },
  { x: 26, y: 12, dx: 5, dy: -6, delay: 0.36 },
  { x: 4, y: 20, dx: -6, dy: 0, delay: 0.4 },
  { x: 28, y: 19, dx: 6, dy: 1, delay: 0.34 },
  { x: 11, y: 8, dx: -3, dy: -7, delay: 0.44 },
  { x: 21, y: 8, dx: 3, dy: -7, delay: 0.42 },
];

const COINS = [
  { x: 11, delay: 0.3 },
  { x: 15, delay: 0.42 },
  { x: 19, delay: 0.36 },
];

function Sprite({
  rows,
  x,
  y,
  fill,
}: {
  rows: string[];
  x: number;
  y: number;
  fill?: string;
}) {
  const rects: { x: number; y: number; w: number; color: string }[] = [];
  rows.forEach((row, ry) => {
    let start = 0;
    for (let i = 1; i <= row.length; i++) {
      if (row[i] === row[start]) continue;
      const ch = row[start];
      if (ch !== ".") {
        rects.push({
          x: x + start,
          y: y + ry,
          w: i - start,
          color: fill ?? PALETTE[ch],
        });
      }
      start = i;
    }
  });
  return rects.map((r) => (
    <rect
      key={`${r.x}-${r.y}`}
      x={r.x}
      y={r.y}
      width={r.w}
      height={1}
      fill={r.color}
    />
  ));
}

export function GiftChest({
  claimed,
  size = 112,
}: {
  claimed: boolean;
  size?: number;
}) {
  // Animasi buka hanya diputar saat status berubah ke klaim di layar ini,
  // bukan saat membuka kotak yang sudah diklaim sebelumnya.
  const [claimedOnMount] = useState(claimed);
  const justClaimed = claimed && !claimedOnMount;
  const state = claimed ? (justClaimed ? "opening" : "open") : "closed";

  return (
    <svg
      viewBox="2 4 28 26"
      width={size}
      height={(size * 26) / 28}
      shapeRendering="crispEdges"
      aria-hidden="true"
      data-state={state}
      className="gift-chest overflow-visible"
    >
      <rect x={8} y={28} width={18} height={1} fill="#3B2350" opacity={0.18} />
      <rect x={10} y={29} width={14} height={1} fill="#3B2350" opacity={0.1} />

      <g className="gift-chest-body">
        {justClaimed ? (
          <g className="gift-chest-glow">
            <rect x={11} y={10} width={10} height={6} fill="#FDE68A" />
            <rect x={13} y={6} width={6} height={4} fill="#FEF3C7" />
          </g>
        ) : null}
        <Sprite rows={BODY} x={7} y={14} />
        {justClaimed
          ? COINS.map((coin) => (
              <g
                key={coin.x}
                className="gift-chest-coin"
                style={{ animationDelay: `${coin.delay}s` } as CSSProperties}
              >
                <Sprite rows={COIN} x={coin.x} y={14} />
              </g>
            ))
          : null}
      </g>

      <g className="gift-chest-lid">
        <Sprite rows={LID} x={6} y={13} />
        <Sprite rows={BOW} x={11} y={10} />
      </g>

      {justClaimed
        ? SPARKS.map((s) => (
            <rect
              key={`${s.x}-${s.y}`}
              x={s.x}
              y={s.y}
              width={1}
              height={1}
              fill={s.x % 2 === 0 ? "#FBBF24" : "#F472B6"}
              className="gift-chest-spark"
              style={
                {
                  "--dx": `${s.dx}px`,
                  "--dy": `${s.dy}px`,
                  animationDelay: `${s.delay}s`,
                } as CSSProperties
              }
            />
          ))
        : null}
    </svg>
  );
}
