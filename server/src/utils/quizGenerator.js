export const generateRandomQuestions = (syllabusText, count = 10) => {
  const lines = syllabusText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const questions = [];
  for (let i = 0; i < Math.min(count, lines.length); i++) {
    questions.push({
      text: `Explain: ${lines[i]}?`,
      options: ["Point 1", "Point 2", "Point 3", "Point 4"],
      correctIndex: 0
    });
  }
  return questions;
};
