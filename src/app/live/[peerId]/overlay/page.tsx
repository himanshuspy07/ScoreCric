
"use client"

import React, { use, useState } from 'react';
import { Inning } from '@/types/cricket';
import { getRunRate, getRequiredRunRate } from '@/lib/match-utils';
import { useLiveViewer } from '@/hooks/use-live-sharing';
import { Swords, Zap } from 'lucide-react';

export default function StreamingOverlay({ params }: { params: Promise<{ peerId: string }> }) {
  const resolvedParams = use(params);
  const { match, status } = useLiveViewer(resolvedParams.peerId);
  const [useGreenScreen, setGreenScreen] = useState(false);

  if (status === 'connecting' || !match) return (
    <div className="h-screen flex items-center justify-center text-white font-black text-xs uppercase tracking-widest opacity-20">
      Waiting for Broadcast...
    </div>
  );

  const currentInning = match.innings[match.currentInning - 1] as Inning;
  
  // Defensive check for transition states
  if (!currentInning) return null;

  const battingTeamObj = currentInning.battingTeam === match.teamA.name ? match.teamA : match.teamB;
  const brandingColor = battingTeamObj.color || '#2C5A37';

  const totalBalls = (currentInning.overs * 6) + currentInning.ballsInOver;
  const matchTotalBalls = (match.currentInning > 2 ? 1 : match.oversLimit) * 6;
  const ballsRemaining = Math.max(0, matchTotalBalls - totalBalls);
  
  const targetScoreIdx = match.currentInning === 2 ? 0 : (match.currentInning === 4 ? 2 : -1);
  const targetScore = targetScoreIdx !== -1 ? (match.innings[targetScoreIdx]?.score || 0) + 1 : 0;
  const rrr = targetScore > 0 ? getRequiredRunRate(targetScore, currentInning.score, ballsRemaining) : null;

  return (
    <div 
      className={`h-screen w-full flex flex-col justify-end p-8 overflow-hidden transition-colors duration-500 ${useGreenScreen ? 'bg-[#00FF00]' : 'bg-transparent'}`}
      onClick={() => setGreenScreen(!useGreenScreen)}
    >
      {/* OBS Overlay Container */}
      <div className="flex items-stretch h-20 bg-black/90 backdrop-blur-xl border-l-[12px] shadow-2xl rounded-r-2xl overflow-hidden animate-in slide-in-from-left-full duration-700" style={{ borderColor: brandingColor }}>
        
        {/* Team & Score Section */}
        <div className="flex items-center px-8 bg-white/5 border-r border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1 flex items-center gap-2">
              {match.isSuperOver && <Swords className="w-3 h-3 text-amber-500" />}
              {match.isSuperOver ? "Super Over" : currentInning.battingTeam}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tighter leading-none">
                {currentInning.score}<span className="text-white/30 text-2xl">/</span>{currentInning.wickets}
              </span>
              <span className="text-sm font-bold text-white/40">
                ({currentInning.overs}.{currentInning.ballsInOver})
              </span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex items-center px-6 gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Run Rate</span>
            <span className="text-xl font-black text-white">{getRunRate(currentInning.score, totalBalls)}</span>
          </div>

          {rrr !== null && (
            <div className="flex flex-col border-l border-white/10 pl-8">
              <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3" /> Req. Rate
              </span>
              <span className="text-xl font-black text-amber-400">{rrr}</span>
            </div>
          )}

          {targetScore > 0 && (
            <div className="flex flex-col border-l border-white/10 pl-8">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target</span>
              <span className="text-xl font-black text-white">{targetScore}</span>
            </div>
          )}
        </div>

        {/* Branding Corner */}
        <div className="ml-auto flex items-center px-6 bg-white/10">
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">ScoreCric Pro</span>
              <div className="flex items-center gap-1.5 mt-1">
                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-white uppercase">Live</span>
              </div>
           </div>
        </div>
      </div>
      
      {/* Click hint for streamer setup (won't show in capture if transparent) */}
      <p className="fixed top-4 right-4 text-[10px] text-white/10 font-bold uppercase select-none pointer-events-none">
        Click background to toggle Green Screen
      </p>
    </div>
  );
}
