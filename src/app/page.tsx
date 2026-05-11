
"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllMatches, deleteMatch } from '@/lib/storage';
import { Match } from '@/types/cricket';
import { Trophy, Plus, History, Trash2, LayoutGrid, ChevronRight } from 'lucide-react';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    setMatches(getAllMatches().sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this match?")) {
      deleteMatch(id);
      setMatches(getAllMatches().sort((a, b) => b.updatedAt - a.updatedAt));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pt-10 pb-20">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight">ScoreCric</h1>
        </div>
        <Link href="/match/setup">
          <Button size="lg" className="rounded-full gap-2 shadow-lg bg-secondary hover:bg-secondary/90 text-white">
            <Plus className="w-5 h-5" /> New Match
          </Button>
        </Link>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Match History</h2>
        </div>

        {matches.length === 0 ? (
          <Card className="border-dashed border-2 py-20 text-center flex flex-col items-center gap-4">
            <LayoutGrid className="w-12 h-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <p className="text-xl font-medium text-muted-foreground">No matches found</p>
              <p className="text-sm text-muted-foreground/60">Start your first cricket match scoring today!</p>
            </div>
            <Link href="/match/setup">
              <Button variant="outline">Start Scoring</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <Link key={match.id} href={`/match/${match.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/20">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${match.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
                        <CardTitle className="text-lg">{match.teamA.name} vs {match.teamB.name}</CardTitle>
                      </div>
                      <CardDescription className="flex gap-2 items-center">
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold">{match.format}</span>
                        <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                        {match.status === 'completed' && <span className="text-secondary font-bold">• Finished</span>}
                      </CardDescription>
                      {match.status === 'live' && (
                        <p className="text-sm font-semibold text-primary">
                          {match.innings[match.currentInning-1]?.score}/{match.innings[match.currentInning-1]?.wickets} ({match.innings[match.currentInning-1]?.overs}.{match.innings[match.currentInning-1]?.ballsInOver})
                        </p>
                      )}
                      {match.status === 'completed' && (
                        <p className="text-sm text-muted-foreground italic">
                          Winner: {match.winner}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, match.id)} className="text-destructive">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="pwa-footer">
        Made by Himanshu Yadav
      </footer>
    </div>
  );
}
