
import { Inning, Ball, PlayerStats, BowlerStats } from '@/types/cricket';

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
