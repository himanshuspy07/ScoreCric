
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
  balls: number;
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
  logoUrl?: string;
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
  currentInning: number;
  innings: Inning[];
  manOfTheMatch?: string;
  winner?: string;
  createdAt: number;
  updatedAt: number;
  ownerId: string;
  isSuperOver?: boolean;
  parentMatchId?: string;
  tournamentId?: string;
}

export type FixtureRound = 'group' | 'semi-final' | 'final';

export interface Fixture {
  id: string;
  teamA: string;
  teamB: string;
  matchId?: string;
  status: 'pending' | 'completed' | 'live';
  round?: FixtureRound;
}

export interface TournamentSettings {
  overs: number;
  playersPerTeam: number;
  matchesPerTeam: number;
  includeKnockouts?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  matchIds: string[];
  teams: Team[];
  settings: TournamentSettings;
  fixtures: Fixture[];
}
