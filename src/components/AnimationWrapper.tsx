
'use client';

import React from 'react';
import { Match } from '@/types/cricket';
import { useCricketAnimation } from '@/hooks/use-cricket-animation';
import { RunScoredEffect } from './effects/RunScoredEffect';
import { WicketEffect } from './effects/WicketEffect';
import { MilestoneEffect } from './effects/MilestoneEffect';

interface AnimationWrapperProps {
  match: Match | null;
  children: React.ReactNode;
}

export function AnimationWrapper({ match, children }: AnimationWrapperProps) {
  const { activeEvent, clearEvent } = useCricketAnimation(match);

  return (
    <>
      {children}
      
      {activeEvent?.type === 'FOUR' && (
        <RunScoredEffect 
          type="FOUR" 
          playerName={activeEvent.playerName} 
          onComplete={clearEvent} 
        />
      )}
      
      {activeEvent?.type === 'SIX' && (
        <RunScoredEffect 
          type="SIX" 
          playerName={activeEvent.playerName} 
          onComplete={clearEvent} 
        />
      )}
      
      {activeEvent?.type === 'WICKET' && (
        <WicketEffect 
          playerName={activeEvent.playerName} 
          onComplete={clearEvent} 
        />
      )}

      {(activeEvent?.type === 'FIFTY' || activeEvent?.type === 'HUNDRED') && (
        <MilestoneEffect 
          type={activeEvent.type} 
          playerName={activeEvent.playerName} 
          runs={activeEvent.runs}
          onComplete={clearEvent} 
        />
      )}
    </>
  );
}
