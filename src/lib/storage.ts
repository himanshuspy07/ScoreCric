
'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types/cricket';

/**
 * Key used for localStorage
 */
const STORAGE_KEY = 'scorecric_matches_v1';

/**
 * Core utility to get matches from localStorage
 */
export const getLocalMatches = (): Match[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse matches from local storage', e);
    return [];
  }
};

/**
 * Saves or updates a match in localStorage.
 * Dispatches a custom event so other components in the same tab can react.
 */
export const saveMatchToLocalStorage = (match: Match) => {
  const matches = getLocalMatches();
  const index = matches.findIndex(m => m.id === match.id);
  const updatedMatch = { ...match, updatedAt: Date.now() };
  
  if (index >= 0) {
    matches[index] = updatedMatch;
  } else {
    matches.unshift(updatedMatch);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  window.dispatchEvent(new CustomEvent('match_update'));
};

/**
 * Deletes a match from localStorage.
 */
export const deleteMatchFromLocalStorage = (id: string) => {
  const matches = getLocalMatches();
  const filtered = matches.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('match_update'));
};

/**
 * Hook to retrieve all matches from localStorage with real-time updates in-tab.
 */
export function useLocalMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setMatches(getLocalMatches());
      setLoading(false);
    };
    
    load();
    window.addEventListener('match_update' as any, load);
    return () => window.removeEventListener('match_update' as any, load);
  }, []);

  return { data: matches, loading };
}

/**
 * Hook to retrieve a single match from localStorage by ID.
 */
export function useLocalMatch(id: string | null) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      if (!id) {
        setMatch(null);
      } else {
        const matches = getLocalMatches();
        setMatch(matches.find(m => m.id === id) || null);
      }
      setLoading(false);
    };
    
    load();
    window.addEventListener('match_update' as any, load);
    return () => window.removeEventListener('match_update' as any, load);
  }, [id]);

  return { data: match, loading };
}
