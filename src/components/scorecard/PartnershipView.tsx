
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inning } from '@/types/cricket';
import { calculatePartnerships } from '@/lib/match-utils';
import { Progress } from '@/components/ui/progress';

export default function PartnershipView({ inning }: { inning: Inning }) {
  const partnerships = calculatePartnerships(inning);
  const maxRuns = Math.max(...partnerships.map(p => p.runs), 1);

  return (
    <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-sm font-black uppercase tracking-widest">Partnership Breakdown</CardTitle>
        <p className="text-[10px] font-bold text-muted-foreground uppercase">{inning.battingTeam} Batting Order</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {partnerships.map((p, i) => (
          <div key={i} className="space-y-2 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-primary uppercase">Wicket {p.wicket}</p>
                <p className="text-xs font-black">{p.players.join(' & ')}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black">{p.runs}</span>
                <span className="text-[10px] text-muted-foreground font-bold ml-1">({p.balls})</span>
              </div>
            </div>
            <Progress value={(p.runs / maxRuns) * 100} className="h-2 rounded-full" />
          </div>
        ))}
        {partnerships.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-20">No Partnerships Recorded</div>
        )}
      </CardContent>
    </Card>
  );
}
