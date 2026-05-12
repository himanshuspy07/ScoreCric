
import { Inning, Ball, Match, Tournament } from '@/types/cricket';

export const calculateOvers = (overs: number, balls: number) => {
  const totalBalls = (overs * 6) + balls;
  return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
};

export const formatOverCount = (totalBalls: number) => {
  return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
};

export const calculateEconomy = (runs: number, totalBalls: number) => {
  if (totalBalls === 0) return '0.00';
  const overs = totalBalls / 6;
  return (runs / overs).toFixed(2);
};

export const calculateStrikeRate = (runs: number, balls: number) => {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
};

export const getRunRate = (score: number, totalBalls: number) => {
  if (totalBalls === 0) return '0.00';
  return ((score / totalBalls) * 6).toFixed(2);
};

export const getRequiredRunRate = (target: number, currentScore: number, ballsRemaining: number) => {
  if (ballsRemaining <= 0) return '0.00';
  const runsNeeded = target - currentScore;
  if (runsNeeded <= 0) return '0.00';
  return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
};

export const getWinProbability = (match: Match): number | null => {
  if (match.currentInning === 1 || match.status === 'completed') return null;
  
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  if (!inn1 || !inn2) return null;

  const target = inn1.score + 1;
  const score = inn2.score;
  const wickets = inn2.wickets;
  const ballsBowled = inn2.overs * 6 + inn2.ballsInOver;
  const totalBalls = match.oversLimit * 6;
  const ballsRemaining = totalBalls - ballsBowled;

  if (score >= target) return 100;
  if (wickets >= 10 || (ballsRemaining <= 0 && score < target)) return 0;

  const rrr = (target - score) / (ballsRemaining / 6 || 1);
  const targetRR = target / (totalBalls / 6);
  
  let prob = 50;
  prob -= (wickets * 6);
  prob -= (rrr - targetRR) * 12;
  
  return Math.round(Math.max(2, Math.min(98, prob)));
};

export const getComparativeManhattanData = (match: Match) => {
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  if (!inn1) return [];

  const maxOvers = match.oversLimit;
  const data = [];

  for (let i = 1; i <= maxOvers; i++) {
    const item: any = { over: i };
    const runs1 = inn1.balls
      .filter(b => b.overNumber + 1 === i)
      .reduce((sum, b) => sum + b.runs + (b.isWide || b.isNoBall ? 1 : 0), 0);
    item.team1 = runs1;
    if (inn2) {
      const isOverStarted = inn2.overs >= i - 1 && (inn2.overs > i - 1 || inn2.ballsInOver > 0);
      if (isOverStarted) {
        const runs2 = inn2.balls
          .filter(b => b.overNumber + 1 === i)
          .reduce((sum, b) => sum + b.runs + (b.isWide || b.isNoBall ? 1 : 0), 0);
        item.team2 = runs2;
      }
    }
    data.push(item);
  }
  return data;
};

export const getComparativeWormData = (match: Match) => {
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  if (!inn1) return [];

  const maxOvers = match.oversLimit;
  const data = [{ over: 0, team1: 0, team2: 0 }];

  for (let i = 1; i <= maxOvers; i++) {
    const item: any = { over: i };
    const ballsInOver1 = inn1.balls.filter(b => b.overNumber < i);
    const score1 = ballsInOver1.length > 0 ? ballsInOver1[ballsInOver1.length - 1].cumulativeScore : 0;
    item.team1 = score1;
    if (inn2) {
      if (inn2.overs >= i || (inn2.overs === i - 1 && inn2.ballsInOver === 0)) {
        const ballsInOver2 = inn2.balls.filter(b => b.overNumber < i);
        const score2 = ballsInOver2.length > 0 ? ballsInOver2[ballsInOver2.length - 1].cumulativeScore : 0;
        item.team2 = score2;
      }
    }
    data.push(item);
  }
  return data;
};

export const calculatePartnerships = (inning: Inning) => {
  const partnerships: Array<{ players: string[]; runs: number; balls: number; wicket: number }> = [];
  let currentPartnership = { players: [] as string[], runs: 0, balls: 0, wicket: 1 };
  
  inning.balls.forEach((ball, idx) => {
    if (!currentPartnership.players.includes(ball.batsmanId)) {
        if (currentPartnership.players.length < 2) {
            currentPartnership.players.push(ball.batsmanId);
        }
    }
    if (!currentPartnership.players.includes(ball.nonStrikerId)) {
        if (currentPartnership.players.length < 2) {
            currentPartnership.players.push(ball.nonStrikerId);
        }
    }

    currentPartnership.runs += ball.runs + (ball.isWide || ball.isNoBall ? 1 : 0);
    if (!ball.isWide) currentPartnership.balls += 1;

    if (ball.isWicket) {
      partnerships.push({ ...currentPartnership });
      const remainingPlayer = currentPartnership.players.find(p => p !== ball.batsmanId);
      currentPartnership = {
        players: remainingPlayer ? [remainingPlayer] : [],
        runs: 0,
        balls: 0,
        wicket: currentPartnership.wicket + 1
      };
    }
  });

  if (currentPartnership.players.length > 0 && currentPartnership.runs > 0) {
    partnerships.push(currentPartnership);
  }

  return partnerships;
};

export const calculateTournamentStandings = (matches: Match[], tournamentTeams: string[]) => {
  const standings: Record<string, { played: number; won: number; lost: number; points: number; nrr: number; runsFor: number; ballsFor: number; runsAgainst: number; ballsAgainst: number }> = {};

  tournamentTeams.forEach(team => {
    standings[team] = { played: 0, won: 0, lost: 0, points: 0, nrr: 0, runsFor: 0, ballsFor: 0, runsAgainst: 0, ballsAgainst: 0 };
  });

  matches.filter(m => m.status === 'completed').forEach(m => {
    const teamA = m.teamA.name;
    const teamB = m.teamB.name;
    const inn1 = m.innings[0]!;
    const inn2 = m.innings[1]!;

    standings[teamA].played += 1;
    standings[teamB].played += 1;

    if (m.winner === teamA) {
      standings[teamA].won += 1;
      standings[teamA].points += 2;
      standings[teamB].lost += 1;
    } else if (m.winner === teamB) {
      standings[teamB].won += 1;
      standings[teamB].points += 2;
      standings[teamA].lost += 1;
    } else {
      standings[teamA].points += 1;
      standings[teamB].points += 1;
    }

    // NRR Calculations
    standings[inn1.battingTeam].runsFor += inn1.score;
    standings[inn1.battingTeam].ballsFor += (m.oversLimit * 6); // Standard NRR uses full overs if all out
    standings[inn1.bowlingTeam].runsAgainst += inn1.score;
    standings[inn1.bowlingTeam].ballsAgainst += (m.oversLimit * 6);

    standings[inn2.battingTeam].runsFor += inn2.score;
    standings[inn2.battingTeam].ballsFor += inn2.wickets === (m.teamA.players.length - 1) ? (m.oversLimit * 6) : (inn2.overs * 6 + inn2.ballsInOver);
    standings[inn2.bowlingTeam].runsAgainst += inn2.score;
    standings[inn2.bowlingTeam].ballsAgainst += inn2.wickets === (m.teamA.players.length - 1) ? (m.oversLimit * 6) : (inn2.overs * 6 + inn2.ballsInOver);
  });

  Object.keys(standings).forEach(team => {
    const s = standings[team];
    const rrFor = (s.runsFor / (s.ballsFor / 6 || 1));
    const rrAgainst = (s.runsAgainst / (s.ballsAgainst / 6 || 1));
    s.nrr = rrFor - rrAgainst;
  });

  return Object.entries(standings)
    .sort((a, b) => b[1].points - a[1].points || b[1].nrr - a[1].nrr)
    .map(([team, stats]) => ({ team, ...stats }));
};

export const calculatePlayerOfTheMatch = (match: Match): string => {
  const scores: Record<string, number> = {};
  match.innings.forEach(inning => {
    if (!inning) return;
    Object.values(inning.batsmen).forEach(b => {
      let points = b.runs;
      points += b.fours * 2;
      points += b.sixes * 4;
      if (b.balls >= 10) {
        const sr = (b.runs / b.balls) * 100;
        if (sr > 180) points += 20;
        else if (sr > 150) points += 10;
      }
      if (b.runs >= 50) points += 25;
      if (b.runs >= 100) points += 50;
      scores[b.name] = (scores[b.name] || 0) + points;
    });
    Object.values(inning.bowlers).forEach(bw => {
      let points = bw.wickets * 25;
      const totalBalls = bw.overs * 6 + bw.balls;
      if (totalBalls >= 12) {
        const eco = (bw.runsConceded / (totalBalls / 6));
        if (eco < 5) points += 25;
        else if (eco < 7) points += 12;
      }
      if (bw.wickets >= 3) points += 25;
      if (bw.wickets >= 5) points += 50;
      if (bw.maidens > 0) points += bw.maidens * 15;
      scores[bw.name] = (scores[bw.name] || 0) + points;
    });
  });
  let winner = 'N/A';
  let maxPoints = -1;
  Object.entries(scores).forEach(([name, points]) => {
    if (points > maxPoints) {
      maxPoints = points;
      winner = name;
    }
  });
  return winner;
};
