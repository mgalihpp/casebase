"use client";

import { useState } from "react";

type Tone = { border: string; bg: string; text: string };

const PAIR_TONES: Tone[] = [
  { border: "#4F46E5", bg: "#EEEDFD", text: "#3730A3" },
  { border: "#0E7490", bg: "#E6F6FA", text: "#0E7490" },
  { border: "#F59E0B", bg: "#FEF3C7", text: "#78350F" },
  { border: "#E11D48", bg: "#FFF1F4", text: "#BE123C" },
  { border: "#7C3AED", bg: "#F3EEFF", text: "#5B21B6" },
  { border: "#13AA52", bg: "#E8F8EE", text: "#0B6B33" },
];

const chipBase =
  "min-h-11 rounded-xl border-[1.5px] border-b-[3px] px-3 font-mono text-[15px] font-bold transition active:translate-y-0.5";

type TebakProps = {
  columns: string[];
  rows: (string | number)[][];
  disabled: boolean;
  onChange: (rows: number[] | null) => void;
};

// Ketuk baris yang lolos syarat. Jawaban kosong sah, karena bisa saja tidak ada baris yang lolos.
export function TebakRows({ columns, rows, disabled, onChange }: TebakProps) {
  const [picked, setPicked] = useState<number[]>([]);

  function toggle(position: number) {
    const next = picked.includes(position)
      ? picked.filter((item) => item !== position)
      : [...picked, position];
    setPicked(next);
    onChange(next.length > 0 ? next : null);
  }

  const template = { gridTemplateColumns: `repeat(${columns.length}, 1fr)` };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="grid gap-2 px-4 font-mono text-xs font-bold text-ink-soft"
        style={template}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row, position) => {
        const selected = picked.includes(position);
        return (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: baris soal tidak punya id dan urutannya tetap
            key={position}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => toggle(position)}
            className={`grid min-h-12 items-center gap-2 rounded-2xl border-2 border-b-4 px-4 py-2.5 text-left font-mono text-[15px] font-semibold transition active:translate-y-0.5 ${selected ? "border-ind bg-ind-soft text-ind-7 anim-tap-bounce" : "border-line bg-white text-ink"}`}
            style={template}
          >
            {row.map((cell, cellIndex) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: sel soal tidak punya id
                key={cellIndex}
                className="break-words"
              >
                {String(cell)}
              </span>
            ))}
          </button>
        );
      })}
      <p className="text-[13px] text-ink-soft">
        Ketuk semua baris yang lolos. Ketuk lagi untuk melepas.
      </p>
    </div>
  );
}

type SalahProps = {
  tokens: string[];
  options: string[];
  disabled: boolean;
  onChange: (answer: { token: number; fix: number } | null) => void;
};

// Dua langkah: temukan bagian yang keliru, lalu pilih perbaikannya.
export function SalahToken({
  tokens,
  options,
  disabled,
  onChange,
}: SalahProps) {
  const [token, setToken] = useState<number | null>(null);
  const [fix, setFix] = useState<number | null>(null);

  function pickToken(position: number) {
    setToken(position);
    setFix(null);
    onChange(null);
  }

  function pickFix(position: number) {
    setFix(position);
    if (token !== null) onChange({ token, fix: position });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink-soft">
          1. Ketuk bagian yang keliru
        </p>
        <div className="flex flex-wrap gap-2 rounded-2xl border-2 border-b-4 border-line bg-[#FCFCFF] p-3">
          {tokens.map((text, position) => {
            const selected = token === position;
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: posisi token adalah identitasnya dalam query
                key={`${text}-${position}`}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => pickToken(position)}
                className={`${chipBase} ${selected ? "border-[#F59E0B] bg-[#FEF3C7] text-[#78350F] anim-tap-bounce" : "border-line bg-white text-ink"}`}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>
      {token !== null ? (
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0 anim-slide-up">
          <legend className="mb-2 p-0 text-[13px] font-semibold text-ink-soft">
            2. Ganti “{tokens[token]}” dengan
          </legend>
          {options.map((option, position) => {
            const selected = fix === position;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => pickFix(position)}
                className={`min-h-14 rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-mono text-[15px] font-bold transition active:translate-y-0.5 ${selected ? "border-ind bg-ind-soft text-ind-7 anim-tap-bounce" : "border-line bg-white text-ink"}`}
              >
                {option}
              </button>
            );
          })}
        </fieldset>
      ) : null}
    </div>
  );
}

type PasangProps = {
  kiri: string[];
  kanan: string[];
  disabled: boolean;
  onChange: (pairs: number[] | null) => void;
};

// Ketuk satu kartu kiri, lalu kartu kanan pasangannya. Pasangan berbagi warna dan nomor.
export function PasangKunci({ kiri, kanan, disabled, onChange }: PasangProps) {
  const [pairs, setPairs] = useState<(number | null)[]>(() =>
    kiri.map(() => null),
  );
  const [left, setLeft] = useState<number | null>(null);

  function publish(next: (number | null)[]) {
    setPairs(next);
    onChange(next.every((item) => item !== null) ? (next as number[]) : null);
  }

  function tapLeft(position: number) {
    if (pairs[position] !== null) {
      publish(pairs.map((item, i) => (i === position ? null : item)));
      setLeft(null);
      return;
    }
    setLeft(position);
  }

  function tapRight(position: number) {
    const owner = pairs.indexOf(position);
    if (owner !== -1) {
      publish(pairs.map((item, i) => (i === owner ? null : item)));
      return;
    }
    if (left === null) return;
    publish(pairs.map((item, i) => (i === left ? position : item)));
    setLeft(null);
  }

  const toneOf = (leftPosition: number) =>
    PAIR_TONES[leftPosition % PAIR_TONES.length];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <p className="text-[13px] font-semibold text-ink-soft">Ketuk dulu</p>
        <p className="text-[13px] font-semibold text-ink-soft">
          Lalu pasangannya
        </p>
        {kiri.map((text, position) => {
          const paired = pairs[position] !== null;
          const active = left === position;
          const tone = toneOf(position);
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: posisi baris adalah identitas pasangan
              key={position}
              className="contents"
            >
              <button
                type="button"
                aria-pressed={paired || active}
                disabled={disabled}
                onClick={() => tapLeft(position)}
                className="min-h-14 rounded-2xl border-2 border-b-4 px-3 py-2.5 text-left font-mono text-[14px] font-bold leading-snug transition active:translate-y-0.5"
                style={
                  paired || active
                    ? {
                        borderColor: active ? "#4F46E5" : tone.border,
                        background: active ? "#EEEDFD" : tone.bg,
                        color: active ? "#3730A3" : tone.text,
                      }
                    : { borderColor: "#E4E1F0", background: "#fff" }
                }
              >
                {paired ? `${position + 1}. ` : ""}
                {text}
              </button>
              <PasangRight
                position={position}
                text={kanan[position] ?? ""}
                pairs={pairs}
                tones={toneOf}
                disabled={disabled}
                canPick={left !== null}
                onTap={tapRight}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PasangRight({
  position,
  text,
  pairs,
  tones,
  disabled,
  canPick,
  onTap,
}: {
  position: number;
  text: string;
  pairs: (number | null)[];
  tones: (leftPosition: number) => Tone;
  disabled: boolean;
  canPick: boolean;
  onTap: (position: number) => void;
}) {
  const owner = pairs.indexOf(position);
  const tone = owner === -1 ? null : tones(owner);
  return (
    <button
      type="button"
      aria-pressed={owner !== -1}
      disabled={disabled || (owner === -1 && !canPick)}
      onClick={() => onTap(position)}
      className="min-h-14 rounded-2xl border-2 border-b-4 px-3 py-2.5 text-left font-mono text-[14px] font-bold leading-snug transition active:translate-y-0.5 disabled:opacity-60"
      style={
        tone
          ? { borderColor: tone.border, background: tone.bg, color: tone.text }
          : { borderColor: "#E4E1F0", background: "#fff" }
      }
    >
      {owner !== -1 ? `${owner + 1}. ` : ""}
      {text}
    </button>
  );
}
