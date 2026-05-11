
export type DismissalType = 
  | 'bowled' 
  | 'caught' 
  | 'lbw' 
  | 'run out' 
  | 'stumped' 
  | 'hit wicket' 
  | 'handled ball' 
  | 'timed out' 
  | 'obstructing field' 
  | 'retired' 
  | 'not out';

export interface PlayerStats {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  bowlerName?: string;
  fielderName?: string;
}

export interface BowlerStats {
  id: string;
  name: string;
  overs: number;
  balls: number; // For fractional overs (3.3 = 3 overs 3 balls)
  maidens: number;
  runsConceded: number;
  wickets: number;
  dots: number;
}

export interface Ball {
  id: string;
  bowlerId: string;
  batsmanId: string;
  nonStrikerId: string;
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isByes: boolean;
  isLegByes: boolean;
  isWicket: boolean;
  wicketType?: DismissalType;
  fielderId?: string;
  cumulativeScore: number;
  overNumber: number;
  ballNumber: number;
}

export interface Team {
  name: string;
  players: string[];
  color?: string;
}

export interface Inning {
  battingTeam: string;
  bowlingTeam: string;
  score: number;
  wickets: number;
  overs: number;
  ballsInOver: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  balls: Ball[];
  batsmen: Record<string, PlayerStats>;
  bowlers: Record<string, BowlerStats>;
  fallOfWickets: Array<{ wicket: number; score: number; overs: string }>;
}

export type MatchStatus = 'upcoming' | 'live' | 'completed';

export interface Match {
  id: string;
  title: string;
  format: 'T20' | 'ODI' | 'Test' | 'Custom';
  oversLimit: number;
  teamA: Team;
  teamB: Team;
  tossWinner?: string;
  tossChoice?: 'bat' | 'bowl';
  status: MatchStatus;
  currentInning: 1 | 2;
  innings: [Inning, Inning | null];
  manOfTheMatch?: string;
  winner?: string;
  createdAt: number;
  updatedAt: number;
}
