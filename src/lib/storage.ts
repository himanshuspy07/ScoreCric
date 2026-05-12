
'use client';

import { useState, useEffect } from 'react';
import { Match, Tournament } from '@/types/cricket';

const STORAGE_KEY = 'scorecric_matches_v2';
const TOURNAMENT_KEY = 'scorecric_tournaments_v1';

export const getLocalMatches = (): Match[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveMatchToLocalStorage = (match: Match) => {
  const matches = getLocalMatches();
  const index = matches.findIndex(m => m.id === match.id);
  const updatedMatch = { ...match, updatedAt: Date.now() };
  if (index >= 0) matches[index] = updatedMatch;
  else matches.unshift(updatedMatch);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  window.dispatchEvent(new CustomEvent('match_update'));
};

export const deleteMatchFromLocalStorage = (id: string) => {
  const matches = getLocalMatches();
  const filtered = matches.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('match_update'));
};

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

export function useLocalMatch(id: string | null) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = () => {
      if (!id) setMatch(null);
      else {
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

export const getLocalTournaments = (): Tournament[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TOURNAMENT_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveTournamentToLocalStorage = (tournament: Tournament) => {
  const tournaments = getLocalTournaments();
  const index = tournaments.findIndex(t => t.id === tournament.id);
  if (index >= 0) tournaments[index] = tournament;
  else tournaments.unshift(tournament);
  localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(tournaments));
  window.dispatchEvent(new CustomEvent('tournament_update'));
};

export function useLocalTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = () => {
      setTournaments(getLocalTournaments());
      setLoading(false);
    };
    load();
    window.addEventListener('tournament_update' as any, load);
    return () => window.removeEventListener('tournament_update' as any, load);
  }, []);
  return { data: tournaments, loading };
}

export function useLocalTournament(id: string | null) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = () => {
      if (!id) setTournament(null);
      else {
        const tournaments = getLocalTournaments();
        setTournament(tournaments.find(t => t.id === id) || null);
      }
      setLoading(false);
    };
    load();
    window.addEventListener('tournament_update' as any, load);
    return () => window.removeEventListener('tournament_update' as any, load);
  }, [id]);
  return { data: tournament, loading };
}
