
'use client';

import { useState, useEffect, useRef } from 'react';
import { Match, Inning, PlayerStats } from '@/types/cricket';

export type CricketAnimationEvent = 
  | 'FOUR' 
  | 'SIX' 
  | 'WICKET' 
  | 'FIFTY' 
  | 'HUNDRED' 
  | 'NONE';

export interface AnimationData {
  type: CricketAnimationEvent;
  playerName?: string;
  runs?: number;
}

export function useCricketAnimation(match: Match | null) {
  const [activeEvent, setActiveEvent] = useState<AnimationData | null>(null);
  const prevMatchRef = useRef<Match | null>(null);

  useEffect(() => {
    if (!match) return;

    const prevMatch = prevMatchRef.current;
    if (!prevMatch) {
      prevMatchRef.current = JSON.parse(JSON.stringify(match));
      return;
    }

    const currentInning = match.innings[match.currentInning - 1];
    const prevInning = prevMatch.innings[prevMatch.currentInning - 1];

    if (!currentInning || !prevInning) return;

    // 1. Detect Boundaries and Wickets from the latest ball
    if (currentInning.balls.length > prevInning.balls.length) {
      const lastBall = currentInning.balls[currentInning.balls.length - 1];
      const batsman = currentInning.batsmen[lastBall.batsmanId];

      if (lastBall.isWicket) {
        setActiveEvent({ type: 'WICKET', playerName: lastBall.batsmanId });
      } else if (lastBall.runs === 4 && !lastBall.isByes && !lastBall.isLegByes) {
        setActiveEvent({ type: 'FOUR', playerName: lastBall.batsmanId });
      } else if (lastBall.runs === 6 && !lastBall.isByes && !lastBall.isLegByes) {
        setActiveEvent({ type: 'SIX', playerName: lastBall.batsmanId });
      }

      // 2. Detect Milestones (50s and 100s)
      if (batsman) {
        const prevBatsman = prevInning.batsmen[lastBall.batsmanId];
        const prevRuns = prevBatsman?.runs || 0;
        const currentRuns = batsman.runs;

        if (prevRuns < 100 && currentRuns >= 100) {
          setActiveEvent({ type: 'HUNDRED', playerName: batsman.name, runs: currentRuns });
        } else if (prevRuns < 50 && currentRuns >= 50) {
          setActiveEvent({ type: 'FIFTY', playerName: batsman.name, runs: currentRuns });
        }
      }
    }

    prevMatchRef.current = JSON.parse(JSON.stringify(match));
  }, [match]);

  const clearEvent = () => setActiveEvent(null);

  return { activeEvent, clearEvent };
}
