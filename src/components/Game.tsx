"use client";
/* CaseBase MVP: satu kursus (MySQL bareng Dibi), satu kasus lengkap, query SQL sungguhan di browser. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CASE, COURSES, KEYWORDS, MAX_HEARTS, MISSIONS, TABLES, XP_BASE, XP_PER_HINT, type Mission } from "../game/content";
import { createCaseDbs, grade, loadSqlJs, runQuery, type CaseDbs, type QueryResult, type SqlValue } from "../game/engine";
import { ic } from "../game/icons";
import { mascotSVG, type MascotKey, type Mood } from "../game/mascots";
import { bumpStreak, fresh, loadProgress, saveProgress, type Progress } from "../game/storage";

/* ---------- bagian kecil ---------- */

function Mascot({ k = "sql", mood = "idle", className = "" }: { k?: MascotKey; mood?: Mood; className?: string }) {
  const html = useMemo(() => mascotSVG(k, mood), [k, mood]);
  return <span className={"mk " + className} dangerouslySetInnerHTML={{ __html: html }} />;
}
const Icon = ({ name }: { name: keyof typeof ic }) => <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: ic[name] }} />;

const AVC = ["#4F5BE0", "#13B28C", "#FF5A5F", "#D9970A", "#8E5BD8", "#2B9BD3", "#C2577A"];
const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const avColor = (n: string) => {
  let h = 0;
  for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVC[h % AVC.length];
};
const Avatar = ({ name }: { name: string }) => (
  <span className="av" style={{ background: avColor(name) }} aria-hidden="true">
    {initials(name)}
  </span>
);

const OKS = ["Tepat sekali!", "Insting detektifmu tajam!", "Bukti tercatat!", "Rapi, lanjut!"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const KW_RE = /\b(SELECT|FROM|WHERE|ORDER|BY|LIMIT|DESC|ASC|AND|OR|NOT|BETWEEN|LIKE|IN|IS|NULL|AS|DISTINCT|JOIN|ON|GROUP|HAVING|COUNT|SUM|AVG|MIN|MAX|TRUE|FALSE)\b/gi;
const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
function highlight(code: string): string {
  return (
    code
      .split(/('[^']*'?)/)
      .map((p, i) =>
        i % 2
          ? `<span class="s">${escHtml(p)}</span>`
          : escHtml(p)
              .replace(KW_RE, '<span class="k">$1</span>')
              .replace(/\b(\d+)\b/g, '<span class="n">$1</span>'),
      )
      .join("") + "\n"
  );
}

function ResultTable({ r }: { r: QueryResult }) {
  if (!r.ok)
    return (
      <div className="err" role="alert">
        <b>Ada yang belum pas.</b> {r.error}
      </div>
    );
  if (!r.columns.length) return <p className="rmeta">QUERY JALAN, TAPI TIDAK ADA HASIL</p>;
  const isNum = (v: SqlValue) => typeof v === "number";
  return (
    <div>
      <p className="rmeta">{r.rows.length} BARIS</p>
      <div className="rtable-wrap">
        <table className="rt">
          <thead>
            <tr>
              {r.columns.map((c, i) => (
                <th key={i} className={r.rows.length && isNum(r.rows[0][i]) ? "num" : ""}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.rows.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td key={j} className={v === null ? "nul" : isNum(v) ? "num" : ""}>
                    {v === null ? "NULL" : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {r.truncated && <p className="truncnote">Hanya 500 baris pertama yang ditampilkan.</p>}
    </div>
  );
}

/* ---------- aplikasi ---------- */

type Screen = "welcome" | "intro" | "map" | "mission" | "solved";
type Modal = null | "courses" | "hearts" | "reset";

export default function Game() {
  const [p, setP] = useState<Progress>(fresh);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mid, setMid] = useState<string | null>(null);
  const [dbs, setDbs] = useState<CaseDbs | null>(null);
  const [engineErr, setEngineErr] = useState<string | null>(null);

  useEffect(() => {
    const prog = loadProgress();
    setP(prog);
    if (prog.started) setScreen("map");
    setLoaded(true);
  }, []);

  const bootEngine = useCallback(() => {
    setEngineErr(null);
    loadSqlJs()
      .then((SQL) => setDbs(createCaseDbs(SQL)))
      .catch((e) => setEngineErr(String(e?.message || e)));
  }, []);
  useEffect(() => bootEngine(), [bootEngine]);

  /* Perubahan progres dihitung langsung dari nilai terbaru, lalu disimpan ke perangkat. */
  const pRef = useRef(p);
  pRef.current = p;
  const update = useCallback((fn: (d: Progress) => void) => {
    const next: Progress = JSON.parse(JSON.stringify(pRef.current));
    fn(next);
    pRef.current = next;
    saveProgress(next);
    setP(next);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const doneCount = MISSIONS.filter((m) => p.done[m.id]).length;
  const currentIdx = MISSIONS.findIndex((m) => !p.done[m.id]);

  const openMission = (id: string) => {
    if (p.hearts <= 0) {
      setModal("hearts");
      return;
    }
    setMid(id);
    setScreen("mission");
  };

  if (!loaded)
    return (
      <div className="app" style={{ background: "#191C48" }}>
        <div className="loading">
          <Mascot mood="think" />
        </div>
      </div>
    );

  const mission = MISSIONS.find((m) => m.id === mid) || null;

  return (
    <div className="app">
      {screen === "welcome" && (
        <Welcome
          onStart={() => {
            update((d) => {
              d.started = true;
            });
            setScreen("intro");
          }}
        />
      )}
      {screen === "intro" && <Intro onGo={() => setScreen("map")} />}
      {screen === "map" && (
        <MapScreen
          p={p}
          doneCount={doneCount}
          currentIdx={currentIdx}
          onOpen={openMission}
          onCourses={() => setModal("courses")}
          onSolved={() => setScreen("solved")}
          onHearts={() => setModal("hearts")}
        />
      )}
      {screen === "mission" && mission && (
        <MissionScreen
          key={mission.id}
          m={mission}
          index={MISSIONS.indexOf(mission)}
          p={p}
          dbs={dbs}
          engineErr={engineErr}
          onRetryEngine={bootEngine}
          onClose={() => setScreen("map")}
          onDraft={(sql) =>
            update((d) => {
              d.drafts[mission.id] = sql;
            })
          }
          onWrong={() => {
            let empty = false;
            update((d) => {
              d.hearts = Math.max(0, d.hearts - 1);
              empty = d.hearts === 0;
            });
            return empty;
          }}
          onHeartsEmpty={() => setModal("hearts")}
          onComplete={(hints, mistakes) => {
            const xp = Math.max(5, (mission.boss ? XP_BASE * 2 : XP_BASE) - hints * XP_PER_HINT);
            let lit = false;
            let streak = 0;
            update((d) => {
              const first = !d.done[mission.id];
              if (first) d.xp += xp;
              d.done[mission.id] = { xp: first ? xp : d.done[mission.id].xp, hints, mistakes, at: new Date().toISOString() };
              lit = bumpStreak(d);
              streak = d.streak;
              if (mission.boss) d.solved = true;
            });
            if (lit) setToast(`Lentera menyala: ${streak} hari beruntun`);
            return xp;
          }}
          onNext={() => {
            if (mission.boss) setScreen("solved");
            else {
              const i = MISSIONS.indexOf(mission);
              const nxt = MISSIONS[i + 1];
              if (nxt && p.hearts > 0) {
                setMid(nxt.id);
              } else setScreen("map");
            }
          }}
          onBackToMap={() => setScreen("map")}
        />
      )}
      {screen === "solved" && <Solved p={p} onMap={() => setScreen("map")} />}

      {modal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="sheet" role="dialog" aria-modal="true">
            {modal === "courses" && (
              <>
                <h3>Pilih kursus</h3>
                <p>Tiap database punya peta, maskot, dan kasusnya sendiri.</p>
                <div className="clist">
                  {COURSES.map((c) => (
                    <button
                      key={c.key}
                      className={"citem " + (c.ready ? "sel" : "")}
                      style={{ ["--cc" as string]: c.c, ["--cl" as string]: c.cl }}
                      disabled={!c.ready}
                      onClick={() => setModal(null)}
                    >
                      <span className="cm">
                        <Mascot k={c.key} />
                      </span>
                      <span className="ct">
                        <b>{c.course}</b>
                        <span className="s">
                          {c.mascot} · {c.sub}
                        </span>
                        {c.ready && (
                          <span className="cbar" aria-label={`${doneCount} dari ${MISSIONS.length} misi`}>
                            <i style={{ width: `${(doneCount / MISSIONS.length) * 100}%` }} />
                          </span>
                        )}
                      </span>
                      {c.ready ? <span className="pr">Aktif</span> : <span className="tag">Segera</span>}
                    </button>
                  ))}
                </div>
                <button className="linkbtn" onClick={() => setModal("reset")}>
                  Ulang progres dari awal
                </button>
              </>
            )}
            {modal === "hearts" && (
              <>
                <Mascot mood="sad" />
                <h3>{p.hearts > 0 ? `Nyawamu ${p.hearts} dari ${MAX_HEARTS}` : "Nyawa habis"}</h3>
                <p>
                  Setiap jawaban yang belum tepat saat Periksa memakai satu nyawa. Tombol Jalankan tetap gratis. Nyawa terisi penuh setiap hari baru.
                </p>
                <div className="btns">
                  <button
                    className="btn"
                    onClick={() => {
                      update((d) => {
                        d.hearts = MAX_HEARTS;
                      });
                      setModal(null);
                      setToast("Nyawa terisi penuh");
                    }}
                  >
                    Isi ulang nyawa
                  </button>
                  <button className="btn soft" onClick={() => setModal(null)}>
                    Nanti saja
                  </button>
                </div>
              </>
            )}
            {modal === "reset" && (
              <>
                <h3>Ulang dari awal?</h3>
                <p>Semua misi, XP, lentera, dan query tersimpan di perangkat ini akan dihapus.</p>
                <div className="btns">
                  <button
                    className="btn coral"
                    onClick={() => {
                      const f = fresh();
                      saveProgress(f);
                      setP(f);
                      setModal(null);
                      setScreen("welcome");
                    }}
                  >
                    Hapus progres
                  </button>
                  <button className="btn soft" onClick={() => setModal("courses")}>
                    Batal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="lantern" />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- layar sambutan ---------- */

function Welcome({ onStart }: { onStart: () => void }) {
  const stars = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({ left: (i * 37) % 100, top: (i * 53) % 60, d: (i % 5) * 0.6 })),
    [],
  );
  const squad: [MascotKey, string][] = [
    ["lite", ""],
    ["pg", "mid"],
    ["sql", "big"],
    ["mongo", "mid"],
    ["redis", ""],
  ];
  return (
    <section className="screen welcome">
      <div className="stars" aria-hidden="true">
        {stars.map((s, i) => (
          <i key={i} style={{ left: s.left + "%", top: s.top + "%", animationDelay: s.d + "s" }} />
        ))}
      </div>
      <div className="w-spot" aria-hidden="true" />
      <div className="w-hero">
        <div className="squad">
          {squad.map(([k, cl], i) => (
            <span key={k} className={"sq " + cl} style={{ ["--dl" as string]: `-${i * 0.45}s` }}>
              <Mascot k={k} />
            </span>
          ))}
        </div>
      </div>
      <div className="w-text">
        <p className="eyebrow">Belajar database lewat kasus</p>
        <h1 className="w-brand">
          Case<span>Base</span>
        </h1>
        <p>Pecahkan kasus detektif dengan menulis query sungguhan. Mulai dari MySQL bareng Dibi.</p>
      </div>
      <div className="w-actions">
        <button className="btn" onClick={onStart}>
          Mulai penyelidikan
        </button>
      </div>
    </section>
  );
}

function Intro({ onGo }: { onGo: () => void }) {
  const suspects = ["Bayu Santoso", "Hendra Kusuma", "Sari Putri", "Rina Wijaya"];
  return (
    <section className="screen intro">
      <div className="scroll">
        <div className="say">
          <div className="say-d">
            <Mascot mood="happy" />
          </div>
          <div className="bubble">Halo, aku Dibi! Ada kasus baru, dan semua buktinya tersimpan di database MySQL.</div>
        </div>
        <div className="folder" style={{ marginTop: 30 }}>
          <h3>{CASE.title}</h3>
          <p>{CASE.intro}</p>
          <div className="suspects">
            {suspects.map((s) => (
              <span className="suspect" key={s}>
                <Avatar name={s} />
                {s.split(" ")[0]}
              </span>
            ))}
            <span className="suspect" style={{ paddingLeft: 10 }}>
              dan 8 lainnya
            </span>
          </div>
        </div>
        <div className="clues">
          <p className="lab">CARA MAIN</p>
          <div className="clue">
            <Icon name="bolt" />
            Tulis query SQL untuk tiap misi. Tombol Jalankan menampilkan hasilnya langsung.
          </div>
          <div className="clue">
            <Icon name="check" />
            Periksa menilai hasil query-mu. Cara penulisan apa pun boleh, asal hasilnya benar.
          </div>
          <div className="clue">
            <Icon name="bulb" />
            Buntu? Ada tiga tingkat petunjuk, tapi XP-nya berkurang.
          </div>
        </div>
      </div>
      <button className="btn" onClick={onGo}>
        Buka peta kasus
      </button>
    </section>
  );
}

/* ---------- peta kasus ---------- */

const OFF = [0, -60, -86, -60, 0, 60, 86, 60];

function MapScreen(props: {
  p: Progress;
  doneCount: number;
  currentIdx: number;
  onOpen: (id: string) => void;
  onCourses: () => void;
  onSolved: () => void;
  onHearts: () => void;
}) {
  const { p, currentIdx } = props;
  const [pop, setPop] = useState<number | null>(null);
  const course = COURSES[0];
  const clues = MISSIONS.filter((m) => p.done[m.id]).map((m) => m.clue);
  return (
    <section className="screen" style={{ ["--c" as string]: course.c, ["--cd" as string]: course.cd }}>
      <header className="hud">
        <button className="hud-course" style={{ ["--cl" as string]: course.cl }} onClick={props.onCourses} aria-label={`Kursus ${course.course}. Ganti kursus`}>
          <span className="mini">
            <Mascot />
          </span>
          <span className="nm">{course.course}</span>
          <Icon name="chev" />
        </button>
        <span className="hud-item s" aria-label={`${p.streak} hari beruntun`}>
          <Icon name="lantern" />
          {p.streak}
        </span>
        <span className="hud-item x" aria-label={`${p.xp} XP`}>
          <Icon name="bolt" />
          {p.xp}
        </span>
        <button className="hud-item h" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={props.onHearts} aria-label={`${p.hearts} nyawa`}>
          <Icon name="heart" />
          {p.hearts}
        </button>
      </header>
      <div className="map-scroll" onClick={(e) => e.target === e.currentTarget && setPop(null)}>
        <div className="case">
          <div className="case-banner">
            <div>
              <p className="cb-eyebrow">Kasus {CASE.n}</p>
              <h2>{CASE.title}</h2>
              <p className="cb-m">{CASE.topics}</p>
            </div>
            <span className="cb-ic">
              <Icon name="glass" />
            </span>
          </div>
          <div className="path">
            {MISSIONS.map((m, i) => {
              const done = !!p.done[m.id];
              const cur = i === currentIdx;
              const locked = !done && !cur;
              const x = OFF[i % OFF.length];
              return (
                <div key={m.id} style={{ width: "100%" }}>
                  {i > 0 && (
                    <div className="steps" style={{ ["--x" as string]: `${(x + OFF[(i - 1) % OFF.length]) / 2}px` }} aria-hidden="true">
                      <Icon name="foot" />
                      <Icon name="foot" />
                    </div>
                  )}
                  <div className="row" style={{ ["--x" as string]: `${x}px` }}>
                    {cur && <span className="start-tag">{doneCount(p) === 0 ? "MULAI" : "LANJUT"}</span>}
                    <button
                      className={`node ${m.boss ? "boss" : ""} ${locked ? "locked" : ""} ${cur ? "current" : ""} ${done ? "done" : ""}`}
                      onClick={() => setPop(pop === i ? null : i)}
                      aria-label={`Misi ${i + 1}: ${m.title}${done ? ", selesai" : locked ? ", terkunci" : ""}`}
                    >
                      <Icon name={locked ? "lock" : done ? "check" : m.boss ? "lamp" : "glass"} />
                    </button>
                    {i === 1 && (
                      <span className="map-dibi r" aria-hidden="true">
                        <Mascot mood={p.solved ? "celebrate" : "idle"} />
                      </span>
                    )}
                    {pop === i && (
                      <div className={"pop " + (locked ? "locked" : "")}>
                        <p className="meta">
                          Misi {i + 1} · {m.topic}
                        </p>
                        <h3>{m.title}</h3>
                        {locked ? (
                          <p>Selesaikan misi sebelumnya untuk membuka misi ini.</p>
                        ) : (
                          <>
                            <p>{done ? `Selesai, +${p.done[m.id].xp} XP. Mau ulangi?` : m.goal}</p>
                            <button className="btn white" style={{ ["--c" as string]: course.c }} onClick={() => props.onOpen(m.id)}>
                              {done ? "Ulangi misi" : m.boss ? `Mulai interogasi +${XP_BASE * 2} XP` : `Mulai +${XP_BASE} XP`}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="board">
          <h3>
            <Icon name="map" />
            Papan bukti
          </h3>
          {clues.length ? (
            clues.map((c, i) => (
              <div className="clue" key={i}>
                <Icon name="check" />
                {c}
              </div>
            ))
          ) : (
            <p className="empty">Belum ada bukti. Petunjuk dari tiap misi akan ditempel di sini.</p>
          )}
        </div>
        {p.solved && (
          <div style={{ margin: "14px 16px 0" }}>
            <button className="btn teal" onClick={props.onSolved}>
              Lihat berkas kasus terpecahkan
            </button>
          </div>
        )}
        <div className="soon">
          <Mascot k="pg" />
          <span>
            Kasus 02 Transaksi Gelap (GROUP BY dan HAVING) sedang disiapkan. Kursus PostgreSQL, MongoDB, Redis, dan SQLite juga menyusul.
          </span>
        </div>
      </div>
    </section>
  );
}
const doneCount = (p: Progress) => MISSIONS.filter((m) => p.done[m.id]).length;

/* ---------- layar misi ---------- */

function MissionScreen(props: {
  m: Mission;
  index: number;
  p: Progress;
  dbs: CaseDbs | null;
  engineErr: string | null;
  onRetryEngine: () => void;
  onClose: () => void;
  onDraft: (sql: string) => void;
  onWrong: () => boolean;
  onHeartsEmpty: () => void;
  onComplete: (hints: number, mistakes: number) => number;
  onNext: () => void;
  onBackToMap: () => void;
}) {
  const { m, p, dbs } = props;
  const [sql, setSql] = useState(p.drafts[m.id] ?? m.starter ?? "");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [hints, setHints] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [openTable, setOpenTable] = useState<string | null>(m.tables[0]);
  const [state, setState] = useState<"edit" | "bad" | "ok" | "accuse" | "won">("edit");
  const [msg, setMsg] = useState("");
  const [mood, setMood] = useState<Mood>("idle");
  const [earned, setEarned] = useState(0);
  const [accusePick, setAccusePick] = useState<string | null>(null);
  const [accuseWrong, setAccuseWrong] = useState<string | null>(null);
  const [heartAnim, setHeartAnim] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tables = TABLES.filter((t) => m.tables.includes(t.name));

  useEffect(() => {
    const t = setTimeout(() => props.onDraft(sql), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql]);

  const insert = (text: string) => {
    const ta = taRef.current;
    const start = ta ? ta.selectionStart : sql.length;
    const end = ta ? ta.selectionEnd : sql.length;
    const before = sql.slice(0, start);
    const after = sql.slice(end);
    const glue = text === "," || text === ";" || text === "'" ? "" : before && !/[\s(']$/.test(before) ? " " : "";
    const tail = text === "'" ? "" : " ";
    const ins = glue + text + tail;
    const next = before + ins + after;
    setSql(next);
    if (state === "bad") setState("edit");
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const pos = before.length + ins.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const run = () => {
    if (!dbs) return;
    setResult(runQuery(dbs.main, sql));
    setMood("think");
    setTimeout(() => setMood("idle"), 1200);
  };

  const check = () => {
    if (!dbs || state === "ok") return;
    const v = grade(dbs, m, sql);
    if (v.ok) {
      setResult(v.result);
      setMood("happy");
      if (m.accuse) {
        setState("accuse");
        setMsg("");
      } else {
        setEarned(props.onComplete(hints, mistakes));
        setState("ok");
        setMsg(pick(OKS));
      }
    } else {
      setResult(v.kind === "error" ? { ok: false, error: v.message } : v.result);
      setMistakes((x) => x + 1);
      setMood("sad");
      setState("bad");
      setMsg(v.message);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 600);
      const empty = props.onWrong();
      if (empty) setTimeout(props.onHeartsEmpty, 900);
    }
    setTimeout(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" }), 60);
  };

  const accuse = () => {
    if (!m.accuse || !accusePick) return;
    if (accusePick === m.accuse.answer) {
      setEarned(props.onComplete(hints, mistakes));
      setMood("celebrate");
      setState("won");
      setMsg("Kasus terpecahkan!");
    } else {
      setAccuseWrong(accusePick);
      setMistakes((x) => x + 1);
      setMood("sad");
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 600);
      const empty = props.onWrong();
      if (empty) setTimeout(props.onHeartsEmpty, 900);
      setTimeout(() => setAccuseWrong(null), 700);
      setAccusePick(null);
      setMsg(m.accuse.wrong);
    }
  };

  const ready = !!dbs;
  const xpNow = Math.max(5, (m.boss ? XP_BASE * 2 : XP_BASE) - hints * XP_PER_HINT);
  const locked = state === "ok" || state === "won";

  return (
    <section className="screen">
      <div className="ls-top">
        <button className="iconbtn" onClick={props.onClose} aria-label="Kembali ke peta">
          <Icon name="close" />
        </button>
        <div className="bar" aria-label={`Misi ${props.index + 1} dari ${MISSIONS.length}`}>
          <i style={{ width: `${((props.index + (locked ? 1 : 0)) / MISSIONS.length) * 100}%` }} />
        </div>
        <span className="xpill">+{xpNow} XP</span>
        <span className={"hearts " + (heartAnim ? "lose" : "")} aria-label={`${p.hearts} nyawa`}>
          <Icon name="heart" />
          {p.hearts}
        </span>
      </div>

      <div className="ls-body" ref={bodyRef}>
        <div className="say ls">
          <div className="say-d">
            <Mascot mood={mood} />
          </div>
          <div className="bubble">{m.story}</div>
        </div>

        <div>
          <span className="ex-label">
            <Icon name={m.boss ? "lamp" : "bolt"} />
            Misi {props.index + 1} · {m.topic}
          </span>
          <h2 className="ex-prompt">{m.goal}</h2>
        </div>

        <div className="tablist" role="tablist" aria-label="Tabel bukti">
          {tables.map((t) => (
            <button key={t.name} className={"tchip " + (openTable === t.name ? "on" : "")} onClick={() => setOpenTable(openTable === t.name ? null : t.name)} aria-expanded={openTable === t.name}>
              {t.name}
              <Icon name="chev" />
            </button>
          ))}
        </div>
        {tables
          .filter((t) => t.name === openTable)
          .map((t) => (
            <div className="schema-card" key={t.name}>
              <div className="sc-h">
                <b>{t.name}</b>
                <span>{t.desc}</span>
              </div>
              <button className="colrow" onClick={() => insert(t.name)} disabled={locked}>
                <span className="nt" style={{ marginLeft: 0, textAlign: "left" }}>
                  Ketuk nama tabel atau kolom untuk menyisipkannya ke query
                </span>
              </button>
              {t.columns.map((c) => (
                <button key={c.name} className="colrow" onClick={() => insert(c.name)} disabled={locked}>
                  <code>{c.name}</code>
                  <span className="ty">{c.type}</span>
                  {c.note && <span className="nt">{c.note}</span>}
                </button>
              ))}
            </div>
          ))}

        <div className="ed-label">
          <span>Query-mu</span>
          {sql && !locked && <button onClick={() => setSql("")}>Bersihkan</button>}
        </div>
        <div className="editor">
          <pre aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlight(sql) }} />
          <textarea
            ref={taRef}
            value={sql}
            readOnly={locked}
            onChange={(e) => {
              setSql(e.target.value);
              if (state === "bad") setState("edit");
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            aria-label="Editor query SQL"
            placeholder=""
          />
        </div>
        {!locked && (
          <div className="chips" aria-label="Sisipkan kata kunci">
            {KEYWORDS.map((k) => (
              <button key={k} className="chip" onClick={() => insert(k)}>
                {k}
              </button>
            ))}
            {tables.map((t) => (
              <button key={"t" + t.name} className="chip" onClick={() => insert(t.name)}>
                {t.name}
              </button>
            ))}
          </div>
        )}
        <div className="runrow">
          <button className="runbtn" onClick={run} disabled={!ready || !sql.trim()}>
            <Icon name="play" />
            Jalankan
          </button>
          <span className="runnote">
            {props.engineErr ? (
              <>
                Mesin SQL gagal dimuat.{" "}
                <button className="linkish" onClick={props.onRetryEngine} style={{ background: "none", border: 0, textDecoration: "underline", color: "inherit", font: "inherit", cursor: "pointer", padding: 0 }}>
                  Coba lagi
                </button>
              </>
            ) : ready ? (
              "Lihat hasilnya dulu, gratis dan tidak mengurangi nyawa."
            ) : (
              "Menyiapkan mesin SQL..."
            )}
          </span>
        </div>
        {result && <ResultTable r={result} />}

        {hints > 0 && (
          <div className="hints">
            {m.hints.slice(0, hints).map((h, i) => (
              <div className="hintbox" key={i}>
                <span className="lv">Petunjuk {i + 1}</span>
                {i === 2 ? <code>{h}</code> : h}
              </div>
            ))}
          </div>
        )}

        {(state === "accuse" || (state === "won" && m.accuse)) && m.accuse && (
          <div className="accuse">
            <h3>{m.accuse.prompt}</h3>
            {m.accuse.options.map((o) => (
              <button
                key={o}
                className={"opt " + (accusePick === o || (state === "won" && o === m.accuse!.answer) ? "sel " : "") + (accuseWrong === o ? "no" : "")}
                onClick={() => state === "accuse" && setAccusePick(o)}
                aria-pressed={accusePick === o}
              >
                <Avatar name={o} />
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={"ls-foot " + (state === "ok" || state === "won" ? "ok" : state === "bad" || (state === "accuse" && msg) ? "bad" : "")}>
        {state === "edit" && (
          <>
            <button className="btn hint" onClick={() => setHints((h) => Math.min(3, h + 1))} disabled={hints >= 3} aria-label={`Petunjuk, sisa ${3 - hints}`}>
              <Icon name="bulb" />
              {3 - hints}
            </button>
            <button className="btn" onClick={check} disabled={!ready || !sql.trim()}>
              Periksa
            </button>
          </>
        )}
        {state === "bad" && (
          <div className="fb">
            <div className="fb-row">
              <span className="fb-ic">
                <Icon name="close" />
              </span>
              <div>
                <h3>Belum cocok dengan bukti</h3>
                <p className="why">{msg}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {hints < 3 && (
                <button className="btn hint" onClick={() => setHints((h) => Math.min(3, h + 1))} style={{ background: "#fff" }}>
                  <Icon name="bulb" />
                </button>
              )}
              <button className="btn coral" onClick={() => setState("edit")}>
                Perbaiki query
              </button>
            </div>
          </div>
        )}
        {state === "accuse" && (
          <div className="fb">
            {msg && (
              <div className="fb-row">
                <span className="fb-ic">
                  <Icon name="close" />
                </span>
                <div>
                  <h3>Bukan dia</h3>
                  <p className="why">{msg}</p>
                </div>
              </div>
            )}
            <button className="btn" onClick={accuse} disabled={!accusePick}>
              Tuduh
            </button>
          </div>
        )}
        {(state === "ok" || state === "won") && (
          <div className="fb">
            <div className="fb-row">
              <span className="fb-ic">
                <Icon name="check" />
              </span>
              <div>
                <span className="combo">+{earned} XP</span>
                <h3>{msg}</h3>
                <p>{m.win}</p>
                <p className="fb-ans">{m.clue}</p>
              </div>
            </div>
            <button className="btn teal" onClick={props.onNext}>
              {state === "won" ? "Tutup kasus" : props.index + 1 < MISSIONS.length ? "Lanjut" : "Kembali ke peta"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- kasus terpecahkan ---------- */

function Solved({ p, onMap }: { p: Progress; onMap: () => void }) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 41) % 100,
        bg: ["#4F5BE0", "#FFBE2E", "#13B28C", "#FF5A5F"][i % 4],
        dur: 2.6 + (i % 5) * 0.5,
        delay: (i % 7) * 0.3,
      })),
    [],
  );
  const vals = Object.values(p.done);
  const hints = vals.reduce((a, d) => a + d.hints, 0);
  const mistakes = vals.reduce((a, d) => a + d.mistakes, 0);
  return (
    <section className="screen solved">
      <div className="confetti" aria-hidden="true">
        {confetti.map((c, i) => (
          <i key={i} className="cf" style={{ left: c.left + "%", background: c.bg, animationDuration: c.dur + "s", animationDelay: c.delay + "s" }} />
        ))}
      </div>
      <div className="scroll">
        <div className="sv-hero">
          <Mascot mood="celebrate" />
        </div>
        <h1>Kasus terpecahkan!</h1>
        <p className="sub">Kasus {CASE.n}: {CASE.title}</p>
        <div className="culprit">
          <p className="lab">PELAKU</p>
          <div className="who">
            <span className="av">{initials(CASE.culprit)}</span>
            <div>
              <b>{CASE.culprit}</b>
              <span>{CASE.culpritRole}</span>
            </div>
          </div>
          <div className="ev">
            <span>Absen 14 Maret</span>
            <span>Kartu gudang 23.38</span>
            <span>Transfer ke BYS-88</span>
          </div>
          <span className="stamp">TERTANGKAP</span>
        </div>
        <div className="stats3">
          <div className="stat" style={{ ["--sc" as string]: "var(--gold-d)" }}>
            <div className="t">Total XP</div>
            <div className="v">
              <Icon name="bolt" />
              {p.xp}
            </div>
          </div>
          <div className="stat" style={{ ["--sc" as string]: "var(--indigo)" }}>
            <div className="t">Petunjuk</div>
            <div className="v">{hints}</div>
          </div>
          <div className="stat" style={{ ["--sc" as string]: "var(--teal)" }}>
            <div className="t">Kesalahan</div>
            <div className="v">{mistakes}</div>
          </div>
        </div>
        <div className="clues">
          <p className="lab">PAPAN BUKTI</p>
          {MISSIONS.map((m) => (
            <div className="clue" key={m.id}>
              <Icon name="check" />
              {m.clue}
            </div>
          ))}
        </div>
        <div className="next-case">
          <b>Kasus 02: Transaksi Gelap</b> menyusul, dengan COUNT, SUM, GROUP BY, dan HAVING.
        </div>
      </div>
      <div className="foot">
        <button className="btn" onClick={onMap}>
          Kembali ke peta
        </button>
      </div>
    </section>
  );
}
