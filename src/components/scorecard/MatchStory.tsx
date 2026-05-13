
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Match, Inning, Ball } from '@/types/cricket';
import { Trophy, Target, Zap, Activity, Clock, AlertCircle } from 'lucide-react';

interface MatchStoryProps {
  match: Match;
}

export default function MatchStory({ match }: MatchStoryProps) {
  const events: any[] = [];

  match.innings.forEach((inning, idx) => {
    if (!inning) return;

    // Inning Start
    events.push({
      type: 'header',
      title: `${idx === 0 ? 'First' : 'Second'} Inning Starts`,
      subtitle: `${inning.battingTeam} to bat`,
      icon: <Clock className="w-4 h-4" />,
      time: match.createdAt + (idx * 3600000) // Rough approximation for sorting
    });

    // Group balls by over to find significant moments
    const overs: Record<number, Ball[]> = {};
    inning.balls.forEach(ball => {
      if (!overs[ball.overNumber]) overs[ball.overNumber] = [];
      overs[ball.overNumber].push(ball);
    });

    Object.entries(overs).forEach(([overNum, balls]) => {
      const overRuns = balls.reduce((sum, b) => sum + b.runs + (b.isWide || b.isNoBall ? 1 : 0), 0);
      const wicketsInOver = balls.filter(b => b.isWicket).length;

      // Big Over (12+ runs)
      if (overRuns >= 12) {
        events.push({
          type: 'milestone',
          title: `Big Over: ${overRuns} Runs`,
          subtitle: `Over ${parseInt(overNum) + 1} by ${balls[0].bowlerId}`,
          icon: <Zap className="w-4 h-4 text-amber-500" />,
          importance: 'high'
        });
      }

      // Wickets
      balls.filter(b => b.isWicket).forEach(b => {
        events.push({
          type: 'wicket',
          title: `Wicket! ${b.batsmanId} Out`,
          subtitle: `${b.wicketType} ${b.wicketType !== 'run out' ? `b ${b.bowlerId}` : ''}`,
          icon: <AlertCircle className="w-4 h-4 text-destructive" />,
          importance: 'critical'
        });
      });
    });

    if (match.status === 'completed' && match.winner && idx === (match.currentInning - 1)) {
       events.push({
          type: 'footer',
          title: 'Match Finished',
          subtitle: match.winner === 'Tie' ? "It's a Tie!" : `${match.winner} won the match`,
          icon: <Trophy className="w-5 h-5 text-amber-500" />
       });
    }
  });

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">
      {events.map((event, i) => (
        <div key={i} className="relative pl-12 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
          <div className={`absolute left-0 w-10 h-10 rounded-full border-4 bg-white flex items-center justify-center z-10 shadow-sm ${
            event.type === 'wicket' ? 'border-destructive text-destructive' : 
            event.type === 'milestone' ? 'border-amber-400 text-amber-600' :
            'border-primary/20 text-primary'
          }`}>
            {event.icon}
          </div>
          <Card className={`border-2 rounded-2xl overflow-hidden shadow-sm ${event.importance === 'critical' ? 'border-destructive/20 bg-destructive/5' : ''}`}>
            <CardContent className="p-4">
              <h4 className="font-black text-sm uppercase tracking-tight">{event.title}</h4>
              <p className="text-xs font-medium text-muted-foreground">{event.subtitle}</p>
            </CardContent>
          </Card>
        </div>
      ))}
      {events.length === 0 && (
        <div className="text-center py-20 border-4 border-dashed rounded-[2.5rem] opacity-20">
          <Activity className="w-12 h-12 mx-auto mb-4" />
          <p className="font-black text-xs uppercase tracking-[0.3em]">Story unfolding...</p>
        </div>
      )}
    </div>
  );
}
