
import { Inning, Ball, Match } from '@/types/cricket';

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

  // Heuristic based calculation
  const rrr = (target - score) / (ballsRemaining / 6 || 1);
  const targetRR = target / (totalBalls / 6);
  
  // Base 50%
  let prob = 50;
  
  // Wicket impact
  prob -= (wickets * 6);
  
  // Run rate impact
  prob -= (rrr - targetRR) * 12;
  
  // Overs remaining factor (more uncertainty early on)
  const uncertaintyFactor = ballsRemaining / totalBalls;
  
  // Adjust bounds
  return Math.max(2, Math.min(98, prob));
};

export const getManhattanData = (inning: Inning) => {
  const overRuns: Record<number, number> = {};
  inning.balls.forEach(ball => {
    const overIdx = ball.overNumber + 1;
    let runs = ball.runs;
    if (ball.isWide || ball.isNoBall) runs += 1;
    overRuns[overIdx] = (overRuns[overIdx] || 0) + runs;
  });

  return Object.entries(overRuns).map(([over, runs]) => ({
    over: `Over ${over}`,
    runs: runs,
  }));
};

export const getWormData = (inning: Inning) => {
  return inning.balls.map((ball, index) => ({
    ball: index + 1,
    score: ball.cumulativeScore,
    over: `${ball.overNumber}.${ball.ballNumber}`
  }));
};
