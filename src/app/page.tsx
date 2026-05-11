"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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
import { useUser } from '@/firebase';
import { deleteMatchFromLocalStorage, useLocalMatches } from '@/lib/storage';
import { Match } from '@/types/cricket';
import { Trophy, Plus, History, Trash2, LayoutGrid, ChevronRight, Activity } from 'lucide-react';

export default function Home() {
  const { user, signInWithGoogle, loading: authLoading } = useUser();
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: matches, loading: matchesLoading } = useLocalMatches();

  const handleDeleteConfirm = () => {
    if (matchToDelete) {
      deleteMatchFromLocalStorage(matchToDelete.id);
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
    <div className="max-w-7xl mx-auto w-full px-4 pt-6 pb-24 sm:pt-10">
      {!user && !authLoading && (
        <section className="mb-12 text-center py-16 px-6 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 hidden md:block">
             <Trophy className="w-80 h-80" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter leading-none">Live Cricket, Pro Results.</h2>
            <p className="text-white/80 text-lg font-medium mb-10 max-w-lg mx-auto">Score matches instantly, analyze performance, and manage your local league with ease.</p>
            <Button onClick={() => signInWithGoogle()} size="lg" variant="secondary" className="rounded-full font-black px-10 h-14 text-lg shadow-xl hover:scale-105 transition-all">
              Get Started Free
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-foreground">
            <Activity className="w-6 h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Recent Matches</h2>
          </div>
          {matches && matches.length > 0 && (
            <Link href="/match/setup">
              <Button variant="outline" size="sm" className="rounded-full gap-2 font-bold border-2">
                <Plus className="w-4 h-4" /> New Match
              </Button>
            </Link>
          )}
        </div>

        {matchesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 w-full bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : !matches || matches.length === 0 ? (
          <Card className="border-dashed border-4 py-24 sm:py-32 text-center flex flex-col items-center gap-8 bg-transparent rounded-[3rem]">
            <div className="bg-muted/50 p-8 rounded-full">
              <LayoutGrid className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/40" />
            </div>
            <div className="space-y-3 px-6">
              <p className="text-2xl sm:text-3xl font-bold text-foreground/80">Ready to start scoring?</p>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto">Your first match will appear here once you begin. All data is saved safely in your browser.</p>
            </div>
            <Link href="/match/setup">
              <Button size="lg" className="px-12 h-14 shadow-xl rounded-full font-black text-lg bg-primary hover:scale-105 transition-transform">Create Match</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div key={match.id} className="relative group overflow-hidden rounded-3xl">
                <Link href={`/match/${match.id}`}>
                  <Card className="h-full hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 hover:border-primary/40 active:scale-[0.98] bg-white group-hover:translate-y-[-4px]">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-2">
                            {match.status === 'live' && (
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                            )}
                            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest">{match.format}</span>
                          </div>
                          <CardTitle className="text-xl sm:text-2xl font-black truncate text-primary leading-tight">{match.teamA.name} <span className="text-muted-foreground/30 font-bold mx-0.5">v</span> {match.teamB.name}</CardTitle>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-bold whitespace-nowrap">{new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>

                      <div className="mt-auto space-y-4">
                        {match.innings[match.currentInning - 1] && (
                          <div className="flex items-baseline gap-3">
                            <p className="text-3xl sm:text-4xl font-black text-foreground tabular-nums">
                              {match.innings[match.currentInning - 1]?.score}<span className="text-muted-foreground/30 text-2xl">/</span>{match.innings[match.currentInning - 1]?.wickets}
                            </p>
                            <p className="text-sm font-black text-muted-foreground opacity-60">
                              ({match.innings[match.currentInning - 1]?.overs}.{match.innings[match.currentInning - 1]?.ballsInOver} <span className="font-medium">Overs</span>)
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-muted">
                           {match.status === 'completed' ? (
                            <p className="text-xs sm:text-sm text-secondary font-black tracking-tight uppercase truncate">
                              {match.winner === 'Tie' ? "MATCH TIED" : `${match.winner} WON`}
                            </p>
                          ) : (
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              <Activity className="w-3 h-3 text-red-500" /> Live Updates
                            </p>
                          )}
                          <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                {user?.uid === match.ownerId && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-9 w-9 rounded-full shadow-lg"
                      onClick={(e) => openDeleteDialog(e, match)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[90%] rounded-[2rem] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Archive Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              This match will be permanently removed from this browser. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-2 mt-6">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold h-12 flex-1 sm:flex-none">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl font-black h-12 flex-1 sm:flex-none"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="pwa-footer bg-white/95 backdrop-blur-md border-t border-primary/5 h-16 flex items-center justify-center">
        <div className="flex items-center justify-center gap-3 font-black tracking-[0.2em] text-primary/40 text-[10px] uppercase">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">ScoreCric</span>
          <span>Fast Sync v3.0</span>
        </div>
      </footer>
    </div>
  );
}
