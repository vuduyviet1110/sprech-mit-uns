/** Client-side mirror of server qualityFromBinary (avoid importing server util). */
export function qualityFromBinaryClient(isCorrect: boolean): number {
  return isCorrect ? 5 : 2
}
