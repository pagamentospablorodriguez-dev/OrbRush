// Double or Nothing — 50/50 chance to double gems or lose them all.
// Pure client-side gambling mechanic for retention.

export interface DoubleOrNothingResult {
  won: boolean;
  newAmount: number;
}

export function flipDoubleOrNothing(currentAmount: number): DoubleOrNothingResult {
  const won = Math.random() < 0.5;
  const newAmount = won ? currentAmount * 2 : 0;
  return { won, newAmount };
}
