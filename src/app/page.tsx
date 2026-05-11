
"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getAllMatches, deleteMatch } from '@/lib/storage';
import { Match } from '@/types/cricket';
import { Trophy, Plus, History, Trash2, LayoutGrid, ChevronRight } from 'lucide-react';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    refreshMatches();
  }, []);

  const refreshMatches = () => {
    setMatches(getAllMatches().sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleDeleteConfirm = () => {
    if (matchToDelete) {
      deleteMatch(matchToDelete.id);
      refreshMatches();
      setMatchToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (e: React.MouseEvent, match: Match) => {
    e.preventDefault();
    e.stopPropagation();
    setMatchToDelete(match);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-6 pb-24 sm:pt-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight text-primary">ScoreCric</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Professional Match Scoring</p>
          </div>
        </div>
        <Link href="/match/setup" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:rounded-full gap-2 shadow-xl bg-secondary hover:bg-secondary/90 text-white h-12 sm:h-11">
            <Plus className="w-5 h-5" /> New Match
          </Button>
        </Link>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-2.5 text-muted-foreground/80">
          <History className="w-5 h-5" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Match History</h2>
        </div>

        {matches.length === 0 ? (
          <Card className="border-dashed border-2 py-16 sm:py-24 text-center flex flex-col items-center gap-6 bg-transparent">
            <div className="bg-muted/50 p-6 rounded-full">
              <LayoutGrid className="w-10 h-10 sm:w-14 sm:h-14 text-muted-foreground/40" />
            </div>
            <div className="space-y-2 px-6">
              <p className="text-lg sm:text-xl font-bold text-foreground/80">No matches found</p>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">Your cricket match history will appear here. Start your first game!</p>
            </div>
            <Link href="/match/setup">
              <Button variant="secondary" className="px-8 shadow-lg">Start Scoring</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <div key={match.id} className="relative group overflow-hidden rounded-xl">
                <Link href={`/match/${match.id}`}>
                  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 active:scale-[0.98] group-hover:bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-5 flex justify-between items-center">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {match.status === 'live' && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                          )}
                          <CardTitle className="text-base sm:text-lg font-bold truncate pr-4">{match.teamA.name} vs {match.teamB.name}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">{match.format}</span>
                          <span className="text-[11px] text-muted-foreground font-medium">{new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {match.status === 'completed' && <span className="text-secondary font-black text-[10px] uppercase tracking-tighter bg-secondary/10 px-2 py-0.5 rounded">Finished</span>}
                        </div>
                        {match.status === 'live' && (
                          <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-xl sm:text-2xl font-black text-primary">
                              {match.innings[match.currentInning - 1]?.score}/{match.innings[match.currentInning - 1]?.wickets}
                            </p>
                            <p className="text-xs font-bold text-muted-foreground">
                              ({match.innings[match.currentInning - 1]?.overs}.{match.innings[match.currentInning - 1]?.ballsInOver})
                            </p>
                          </div>
                        )}
                        {match.status === 'completed' && (
                          <p className="text-xs sm:text-sm text-secondary font-bold italic mt-1 line-clamp-1">
                            {match.winner === 'Tie' ? "Match Tied" : `${match.winner} won`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-3 pr-10 sm:pr-12">
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 z-10">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 sm:h-10 sm:w-10 border-destructive/50 text-destructive bg-white/50 hover:bg-destructive hover:text-white transition-all shadow-md active:scale-90"
                    onClick={(e) => openDeleteDialog(e, match)}
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[90%] rounded-2xl sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete the match between <strong>{matchToDelete?.teamA.name}</strong> and <strong>{matchToDelete?.teamB.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-xl border-2">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
            >
              Delete Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="pwa-footer bg-white/90 backdrop-blur-md border-t border-primary/10">
        <div className="flex items-center justify-center gap-1.5 font-bold tracking-tight text-primary/60">
          <span className="bg-primary text-white text-[8px] px-1 py-0.5 rounded">SC</span>
          <span>SCORECRIC</span>
        </div>
      </footer>
    </div>
  );
}
