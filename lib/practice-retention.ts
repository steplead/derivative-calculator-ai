export type PracticeTopic = 'derivative' | 'integral' | 'limit';

export type MissedProblem = {
  topic: PracticeTopic;
  expression: string;
  limitTo?: string;
  expected?: string;
  at: number;
};

const MAX_MISSED = 40;

export function nextStreak(current: number, correct: boolean): number {
  const safe = Number.isFinite(current) && current > 0 ? Math.floor(current) : 0;
  return correct ? safe + 1 : 0;
}

export function rememberMiss(list: MissedProblem[], item: MissedProblem): MissedProblem[] {
  const limitTo = item.limitTo || '';
  const without = list.filter(
    (entry) => !(entry.topic === item.topic && entry.expression === item.expression && (entry.limitTo || '') === limitTo)
  );
  return [{ ...item, limitTo: item.limitTo || undefined }, ...without].slice(0, MAX_MISSED);
}

export const STREAK_KEY_PREFIX = 'dca:streak:v1:';
export const MISSED_KEY = 'dca:missed:v1';
