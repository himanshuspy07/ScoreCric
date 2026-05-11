
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
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { deleteMatchFromFirestore } from '@/lib/storage';
import { Match } from '@/types/cricket';
import { Trophy, Plus, History, Trash2, LayoutGrid, ChevronRight, LogIn, Activity } from 'lucide-react';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';

export default function Home() {
  const db = useFirestore();
  const { user, signInWithGoogle, loading: authLoading } = useUser();
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const matchesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), orderBy('updatedAt', 'desc'), limit(20));
  }, [db]);

  const { data: matches, loading: matchesLoading } = useCollection<Match>(matchesQuery);

  const handleDeleteConfirm = () => {
    if (matchToDelete && db) {
      deleteMatchFromFirestore(db, matchToDelete.id);
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
      {!user && !authLoading && (
        <section className="mb-12 text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
             <Trophy className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tighter">Live Cricket, Pro Results.</h2>
            <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto">Score matches in real-time, share live analytics, and manage your league across the internet.</p>
            <Button onClick={() => signInWithGoogle()} size="lg" variant="secondary" className="rounded-full font-black px-8 h-12 shadow-xl hover:scale-105 transition-transform">
              Get Started Free
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-foreground">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase">Live & Recent</h2>
          </div>
          {user && (
            <Link href="/match/setup">
              <Button variant="ghost" size="sm" className="font-black text-xs text-primary hover:bg-primary/5 uppercase tracking-widest">
                New Match +
              </Button>
            </Link>
          )}
        </div>

        {matchesLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : !matches || matches.length === 0 ? (
          <Card className="border-dashed border-2 py-16 sm:py-24 text-center flex flex-col items-center gap-6 bg-transparent rounded-3xl">
            <div className="bg-muted/50 p-6 rounded-full">
              <LayoutGrid className="w-10 h-10 sm:w-14 sm:h-14 text-muted-foreground/40" />
            </div>
            <div className="space-y-2 px-6">
              <p className="text-lg sm:text-xl font-bold text-foreground/80">No active matches</p>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">Real-time match data will appear here once scoring begins.</p>
            </div>
            {user && (
              <Link href="/match/setup">
                <Button variant="secondary" className="px-8 shadow-lg rounded-full font-bold">Start First Match</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <div key={match.id} className="relative group overflow-hidden rounded-2xl">
                <Link href={`/match/${match.id}`}>
                  <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/40 active:scale-[0.99] bg-white group-hover:translate-y-[-2px]">
                    <CardContent className="p-5 flex justify-between items-center">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {match.status === 'live' && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          )}
                          <CardTitle className="text-base sm:text-xl font-black truncate text-primary pr-4">{match.teamA.name} <span className="text-muted-foreground/40 font-bold mx-1">v</span> {match.teamB.name}</CardTitle>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest">{match.format}</span>
                          <span className="text-[11px] text-muted-foreground font-bold">{new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          {match.status === 'completed' && <span className="text-secondary font-black text-[10px] uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded-full">Finished</span>}
                        </div>

                        {match.innings[match.currentInning - 1] && (
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl sm:text-3xl font-black text-foreground">
                              {match.innings[match.currentInning - 1]?.score}<span className="text-muted-foreground/30 text-xl">/</span>{match.innings[match.currentInning - 1]?.wickets}
                            </p>
                            <p className="text-xs font-black text-muted-foreground opacity-60">
                              ({match.innings[match.currentInning - 1]?.overs}.{match.innings[match.currentInning - 1]?.ballsInOver} <span className="font-medium">Overs</span>)
                            </p>
                          </div>
                        )}
                        
                        {match.status === 'completed' && (
                          <p className="text-xs sm:text-sm text-secondary font-black tracking-tight mt-1 line-clamp-1">
                            {match.winner === 'Tie' ? "MATCH TIED" : `${match.winner?.toUpperCase()} WON`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 pl-4 border-l border-muted">
                        <ChevronRight className="w-6 h-6 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                {user?.uid === match.ownerId && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full shadow-lg"
                      onClick={(e) => openDeleteDialog(e, match)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[90%] rounded-3xl sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Archive Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              This match will be permanently removed from the cloud. Spectators will no longer be able to view this scorecard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-xl border-2 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-black"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="pwa-footer bg-white/90 backdrop-blur-md border-t border-primary/5">
        <div className="flex items-center justify-center gap-2 font-black tracking-widest text-primary/40 text-[9px] uppercase">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">SC LIVE</span>
          <span>Sync v2.4 PRO</span>
        </div>
      </footer>
    </div>
  );
}
