
"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Match } from '@/types/cricket';
import { Trophy, Share2, Star, Printer, Users } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function MatchSummaryCard({ match }: { match: Match }) {
  const handlePrint = () => {
    window.print();
  };

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  // Safely find top performers across all innings
  const allBatsmen = [
    ...Object.values(inn1?.batsmen || {}),
    ...Object.values(inn2?.batsmen || {})
  ];
  const allBowlers = [
    ...Object.values(inn1?.bowlers || {}),
    ...Object.values(inn2?.bowlers || {})
  ];

  const topBatter = allBatsmen.sort((a, b) => b.runs - a.runs)[0];
  const topBowler = allBowlers.sort((a, b) => b.wickets - a.wickets)[0];

  return (
    <div className="space-y-6">
      <Card id="match-summary-card" className="max-w-md mx-auto overflow-hidden rounded-[2.5rem] border-4 border-primary shadow-2xl bg-white print:border-0 print:shadow-none">
        <div className="bg-primary p-8 text-white text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-amber-400 fill-amber-400" />
          <h2 className="text-3xl font-black tracking-tighter uppercase">{match.title}</h2>
          <p className="text-white/60 font-bold text-xs mt-1 uppercase tracking-widest">{new Date(match.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        </div>

        <CardContent className="p-8 space-y-8">
          <div className="flex justify-between items-center gap-4">
             <div className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-muted shadow-lg flex items-center justify-center font-black text-2xl text-primary/20" style={{ border: `4px solid ${match.teamA.color || '#eee'}` }}>
                  {match.teamA.logoUrl ? (
                    <Image src={match.teamA.logoUrl} alt={match.teamA.name} fill className="object-cover" />
                  ) : (
                    <span>{match.teamA.name[0]}</span>
                  )}
                </div>
                <span className="text-sm font-black text-center">{match.teamA.name}</span>
                <p className="text-2xl font-black">{inn1?.score || 0}/{inn1?.wickets || 0}</p>
             </div>
             <div className="text-2xl font-black text-muted-foreground opacity-20 italic">VS</div>
             <div className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-muted shadow-lg flex items-center justify-center font-black text-2xl text-primary/20" style={{ border: `4px solid ${match.teamB.color || '#eee'}` }}>
                  {match.teamB.logoUrl ? (
                    <Image src={match.teamB.logoUrl} alt={match.teamB.name} fill className="object-cover" />
                  ) : (
                    <span>{match.teamB.name[0]}</span>
                  )}
                </div>
                <span className="text-sm font-black text-center">{match.teamB.name}</span>
                <p className="text-2xl font-black">{inn2?.score || 0}/{inn2?.wickets || 0}</p>
             </div>
          </div>

          <div className="bg-secondary p-4 rounded-2xl text-center text-white font-black text-lg shadow-lg animate-in zoom-in-50 duration-500">
            {match.winner === 'Tie' ? "MATCH TIED" : `${match.winner} WON`}
          </div>

          {match.manOfTheMatch && (
            <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-[2rem] text-center space-y-1 shadow-inner relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-400/5 to-transparent pointer-events-none" />
               <Star className="w-8 h-8 text-amber-500 mx-auto mb-2 fill-amber-500 animate-pulse" />
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Player of the Match</p>
               <h3 className="text-2xl font-black text-amber-900 tracking-tighter">{match.manOfTheMatch}</h3>
               <p className="text-[10px] font-bold text-amber-600/60 uppercase">Outperforming Award 🏆</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-2xl border border-muted">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Top Scorer</p>
               <p className="font-black text-sm truncate">{topBatter?.name || 'N/A'}</p>
               <p className="text-lg font-black text-primary">{topBatter?.runs || 0} <span className="text-xs opacity-40">({topBatter?.balls || 0})</span></p>
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl border border-muted">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Best Bowler</p>
               <p className="font-black text-sm truncate">{topBowler?.name || 'N/A'}</p>
               <p className="text-lg font-black text-primary">{topBowler?.wickets || 0} <span className="text-xs opacity-40">FOR {topBowler?.runsConceded || 0}</span></p>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-center gap-2">
             <div className="bg-primary p-1.5 rounded-lg">
               <Trophy className="w-4 h-4 text-white" />
             </div>
             <span className="font-black text-xs text-primary tracking-tighter">ScoreCric Professional Recap</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 max-w-md mx-auto print:hidden">
         <Button onClick={handlePrint} className="flex-1 h-14 rounded-2xl font-black gap-2 shadow-xl" variant="outline">
           <Printer className="w-5 h-5" /> Export PDF
         </Button>
         <Button onClick={() => {
           if (navigator.share) {
             navigator.share({
               title: 'Match Result: ' + match.title,
               text: `${match.winner} won in a great game! Player of the match: ${match.manOfTheMatch}`,
               url: window.location.href
             });
           }
         }} className="flex-1 h-14 rounded-2xl font-black gap-2 shadow-xl">
           <Share2 className="w-5 h-5" /> Social Share
         </Button>
      </div>
    </div>
  );
}
