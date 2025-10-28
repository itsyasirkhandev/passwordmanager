import { Timestamp } from 'firebase/firestore';

export type PasswordHistoryEntry = {
  password: string;
  timestamp: Timestamp;
};

export const MAX_HISTORY_ENTRIES = 10;

export function addToPasswordHistory(
  currentHistory: PasswordHistoryEntry[] | undefined,
  newPassword: string
): PasswordHistoryEntry[] {
  const history = currentHistory || [];
  const newEntry: PasswordHistoryEntry = {
    password: newPassword,
    timestamp: Timestamp.now(),
  };

  const updatedHistory = [newEntry, ...history];

  return updatedHistory.slice(0, MAX_HISTORY_ENTRIES);
}

export function isPasswordInHistory(
  history: PasswordHistoryEntry[] | undefined,
  password: string
): boolean {
  if (!history || history.length === 0) return false;
  return history.some(entry => entry.password === password);
}
