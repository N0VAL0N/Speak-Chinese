export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleArrayWithCorrect<T>(array: T[], correctValue: T): { shuffled: T[]; correctIndex: number } {
  if (array.length <= 1) {
    return { shuffled: [...array], correctIndex: array.indexOf(correctValue) };
  }
  const shuffled = shuffleArray(array);
  let correctIndex = shuffled.findIndex(item => item === correctValue);
  if (shuffled.length > 1 && correctIndex === 0) {
    const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
    correctIndex = shuffled.findIndex(item => item === correctValue);
  }
  return { shuffled, correctIndex };
}