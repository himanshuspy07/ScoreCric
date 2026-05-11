
import { Match } from '@/types/cricket';

const STORAGE_KEY = 'scorecric_matches';

export const saveMatch = (match: Match) => {
  if (typeof window === 'undefined') return;
  const matches = getAllMatches();
  const index = matches.findIndex(m => m.id === match.id);
  if (index >= 0) {
    matches[index] = { ...match, updatedAt: Date.now() };
  } else {
    matches.push({ ...match, createdAt: Date.now(), updatedAt: Date.now() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
};

export const getAllMatches = (): Match[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getMatchById = (id: string): Match | undefined => {
  const matches = getAllMatches();
  return matches.find(m => m.id === id);
};

export const deleteMatch = (id: string) => {
  const matches = getAllMatches();
  const filtered = matches.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
