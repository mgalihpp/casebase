import { Mascot } from "@/components/ui/mascot";
import { buttonPrimary, pageClass } from "@/components/ui/styles";
import { briefingSteps, type LABEL_SOAL } from "@/features/mission/briefing";

type Props = {
  mascot: string;
  caseNumber: string;
  caseStory: string;
  node: {
    type: "mission" | "chest" | "boss";
    title: string | null;
    topic: string | null;
    bukti: string | null;
    cerita: string | null;
    pelajaran: string | null;
  };
  questions: { type: keyof typeof LABEL_SOAL; prompt: string }[];
  xp: number;
  onStart: () => void;
  onClose: () => void;
};

export function MissionBriefing({
  mascot,
  caseNumber,
  caseStory,
  node,
  questions,
  xp,
  onStart,
  onClose,
}: Props) {
  const boss = node.type === "boss";
  const steps = briefingSteps(questions);

  return (
    <main className={`${pageClass} gap-5 bg-white pb-32 pt-2`}>
      <header className="-mx-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup briefing"
          className="grid h-11 w-11 flex-none place-items-center text-ink-soft"
        >
          ✕
        </button>
        <span className="flex-1 text-sm font-bold text-ink-soft">
          Kasus {caseNumber}
        </span>
        <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1.5 text-[13px] font-semibold text-[#78350F]">
          +{xp} XP
        </span>
      </header>

      <div className="anim-slide-up flex flex-col gap-5">
        <div>
          <span
            className={`inline-block rounded-lg px-2.5 py-1 font-display text-sm font-extrabold ${boss ? "bg-[#FFF1F4] text-[#BE123C]" : "bg-[#EEEDFD] text-[#3730A3]"}`}
          >
            {boss ? "Interogasi" : "Misi"}
          </span>
          <h1 className="mt-2 font-display text-[26px] font-black leading-tight">
            {node.title ?? (boss ? "Interogasi" : "Misi")}
          </h1>
        </div>

        <div className="flex items-end gap-2">
          <Mascot name={mascot} size={64} mood="think" />
          <p className="mb-2 rounded-[14px_14px_14px_4px] border-[1.5px] border-line px-3 py-2.5 text-[15px] leading-[1.45]">
            {node.cerita ?? caseStory}
          </p>
        </div>

        {node.topic ? (
          <section>
            <h2 className="mb-2 font-display text-[17px] font-black">
              Yang akan kamu pelajari
            </h2>
            <span className="inline-block rounded-lg bg-[#EEEDFD] px-2.5 py-1 font-mono text-sm font-bold text-[#3730A3]">
              {node.topic}
            </span>
            {node.pelajaran ? (
              <p className="mt-2 text-[15px] leading-[1.5]">{node.pelajaran}</p>
            ) : null}
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 font-display text-[17px] font-black">
            Yang akan kamu kerjakan
          </h2>
          <ol className="grid gap-2">
            {steps.map((step) => (
              <li
                key={step.no}
                className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-line px-3 py-2.5"
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#EEEDFD] font-display text-[15px] font-black text-[#3730A3]">
                  {step.no}
                </span>
                <span>
                  <span className="block font-display text-[15px] font-extrabold">
                    {step.label}
                  </span>
                  <span className="block text-sm leading-snug text-ink-soft">
                    {step.prompt}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {node.bukti ? (
          <section>
            <h2 className="mb-2 font-display text-[17px] font-black">
              Bukti yang kamu dapat
            </h2>
            <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-[#0E7490] bg-[#E6F6FA] p-3.5">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white text-[#0E7490]">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <path d="M9 13l2 2 4-4" />
                </svg>
              </span>
              <div>
                <p className="font-display text-[15px] font-black text-[#0E7490]">
                  {boss ? "Bukti penentu kasus" : "Masuk ke berkasmu"}
                </p>
                <p className="text-[15px] leading-[1.45]">{node.bukti}</p>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px] border-t border-line bg-white px-4 pb-4 pt-2.5">
        <button
          type="button"
          onClick={onStart}
          className={`${buttonPrimary} normal-case! tracking-normal! text-[17px]!`}
        >
          {boss ? "Mulai interogasi" : "Mulai misi"}
        </button>
      </div>
    </main>
  );
}
