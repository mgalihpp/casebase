export const LABEL_SOAL = {
  write: "Tulis query",
  pilih: "Pilih jawaban",
  susun: "Susun query",
  tebak: "Tebak hasil",
  salah: "Cari kesalahan",
  pasang: "Pasangkan kunci",
} as const;

type BriefingQuestion = { type: keyof typeof LABEL_SOAL; prompt: string };

export function briefingSteps(questions: BriefingQuestion[]) {
  return questions.map((question, index) => ({
    no: index + 1,
    label: LABEL_SOAL[question.type],
    prompt: question.prompt,
  }));
}

/** Briefing hanya muncul saat misi dimulai dari soal pertama, bukan saat melanjutkan. */
export function shouldShowBriefing(questionIndex: number) {
  return questionIndex === 0;
}
