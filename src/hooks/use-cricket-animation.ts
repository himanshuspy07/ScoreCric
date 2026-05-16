
'use client';

import { useState, useEffect, useRef } from 'react';
import { Match } from '@/types/cricket';

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

/**
 * useCricketAnimation Hook
 * Optimized to detect match events without expensive deep cloning.
 */
export function useCricketAnimation(match: Match | null) {
  const [activeEvent, setActiveEvent] = useState<AnimationData | null>(null);
  
  // Track specific metrics instead of the whole object
  const lastProcessedInningRef = useRef<number | null>(null);
  const lastProcessedBallCountRef = useRef<number>(0);
  const lastProcessedScoresRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!match) return;

    const currentInningIdx = match.currentInning - 1;
    const currentInning = match.innings[currentInningIdx];

    if (!currentInning) return;

    // Reset markers if we've switched innings
    if (lastProcessedInningRef.current !== currentInningIdx) {
      lastProcessedInningRef.current = currentInningIdx;
      lastProcessedBallCountRef.current = currentInning.balls.length;
      
      const scores: Record<string, number> = {};
      Object.values(currentInning.batsmen).forEach(b => {
        scores[b.id] = b.runs;
      });
      lastProcessedScoresRef.current = scores;
      return;
    }

    // Only process if a new ball was added
    if (currentInning.balls.length > lastProcessedBallCountRef.current) {
      const lastBall = currentInning.balls[currentInning.balls.length - 1];
      const batsman = currentInning.batsmen[lastBall.batsmanId];

      if (lastBall.isWicket) {
        setActiveEvent({ type: 'WICKET', playerName: lastBall.batsmanId });
      } else if (lastBall.runs === 4 && !lastBall.isByes && !lastBall.isLegByes) {
        setActiveEvent({ type: 'FOUR', playerName: lastBall.batsmanId });
      } else if (lastBall.runs === 6 && !lastBall.isByes && !lastBall.isLegByes) {
        setActiveEvent({ type: 'SIX', playerName: lastBall.batsmanId });
      }

      // Detect Milestones
      if (batsman) {
        const prevRuns = lastProcessedScoresRef.current[batsman.id] || 0;
        const currentRuns = batsman.runs;

        if (prevRuns < 100 && currentRuns >= 100) {
          setActiveEvent({ type: 'HUNDRED', playerName: batsman.name, runs: currentRuns });
        } else if (prevRuns < 50 && currentRuns >= 50) {
          setActiveEvent({ type: 'FIFTY', playerName: batsman.name, runs: currentRuns });
        }
        
        // Update local score tracking
        lastProcessedScoresRef.current[batsman.id] = currentRuns;
      }
      
      lastProcessedBallCountRef.current = currentInning.balls.length;
    }
  }, [match]);

  const clearEvent = () => setActiveEvent(null);

  return { activeEvent, clearEvent };
}
