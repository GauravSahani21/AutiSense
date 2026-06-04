/** Normalize category scores for ResultPage (fractions 0–1, capitalized keys). */
export function normalizeCategories(raw, answerArray = []) {
  if (raw?.Social !== undefined) return raw;

  const caps = {
    social: 'Social',
    communication: 'Communication',
    behavior: 'Behavior',
    sensory: 'Sensory',
    routine: 'Routine',
  };
  const maxByKey = { social: 5, communication: 5, behavior: 5, sensory: 3, routine: 2 };

  if (raw?.social !== undefined) {
    return Object.fromEntries(
      Object.entries(caps).map(([lower, cap]) => [
        cap,
        Number(((raw[lower] ?? 0) / maxByKey[lower]).toFixed(3)),
      ])
    );
  }

  if (answerArray.length !== 20) return {};

  return {
    Social: Number((answerArray.slice(0, 4).filter((a) => a === 0).length / 4).toFixed(3)),
    Communication: Number((answerArray.slice(4, 8).filter((a) => a === 0).length / 4).toFixed(3)),
    Behavior: Number(
      ([...answerArray.slice(8, 10).map((a) => 1 - a), ...answerArray.slice(10, 12)].reduce((s, v) => s + v, 0) / 4
      ).toFixed(3)
    ),
    Sensory: Number((answerArray.slice(12, 16).reduce((s, v) => s + v, 0) / 4).toFixed(3)),
    Routine: Number(
      ([...answerArray.slice(16, 19), 1 - answerArray[19]].reduce((s, v) => s + v, 0) / 4
      ).toFixed(3)
    ),
  };
}

export function mchatScoreFromAnswers(answerArray) {
  return answerArray.reduce(
    (sum, a, i) => sum + ((i <= 9 || i === 19 ? a === 0 : a === 1) ? 1 : 0),
    0
  );
}
