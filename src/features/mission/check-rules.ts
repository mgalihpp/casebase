export type CheckRuleInput = {
  /** Soal yang sedang aktif di percobaan misi (dimulai dari 0). */
  activeIndex: number;
  /** Soal yang dikirim klien. */
  questionIndex: number;
  /** Jumlah soal di node ini. */
  total: number;
  correct: boolean;
};

export type CheckRule = {
  /** Jawaban hanya dinilai jika dikirim untuk soal yang sedang aktif. */
  accepted: boolean;
  /** Maju ke soal berikutnya. */
  advance: boolean;
  /** Node selesai: soal terakhir dijawab benar. */
  nodeDone: boolean;
};

export function checkRule({
  activeIndex,
  questionIndex,
  total,
  correct,
}: CheckRuleInput): CheckRule {
  const accepted = questionIndex === activeIndex;
  const nodeDone = accepted && correct && questionIndex === total - 1;
  return {
    accepted,
    advance: accepted && correct && !nodeDone,
    nodeDone,
  };
}
