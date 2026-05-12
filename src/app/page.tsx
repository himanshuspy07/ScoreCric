
"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { deleteMatchFromLocalStorage, useLocalMatches, useLocalTournaments } from '@/lib/storage';
import { Match, Tournament } from '@/types/cricket';
import { Trophy, Plus, History, Trash2, LayoutGrid, ChevronRight, Activity, Calendar } from 'lucide-react';

export default function Home() {
  const { user, signInWithGoogle, loading: authLoading } = useUser();
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: matches, loading: matchesLoading } = useLocalMatches();
  const { data: tournaments } = useLocalTournaments();

  const handleDeleteConfirm = () => {
    if (matchToDelete) {
      deleteMatchFromLocalStorage(matchToDelete.id);
      setMatchToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 pt-6 pb-24 sm:pt-10">
      {!user && !authLoading && (
        <section className="mb-12 text-center py-16 px-6 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter leading-none">Live Cricket, Pro Results.</h2>
            <p className="text-white/80 text-lg font-medium mb-10">Score matches instantly and manage your local league with ease.</p>
            <Button onClick={() => signInWithGoogle()} size="lg" variant="secondary" className="rounded-full font-black px-10 h-14 text-lg shadow-xl">
              Get Started Free
            </Button>
          </div>
        </section>
      )}

      <Tabs defaultValue="matches" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-white/50 border p-1 rounded-2xl h-12 w-fit">
            <TabsTrigger value="matches" className="rounded-xl font-black text-xs uppercase tracking-widest px-6">Recent Matches</TabsTrigger>
            <TabsTrigger value="tournaments" className="rounded-xl font-black text-xs uppercase tracking-widest px-6">Tournaments</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Link href="/tournament/setup">
              <Button variant="outline" size="sm" className="rounded-full gap-2 font-bold border-2">
                <Calendar className="w-4 h-4" /> New Tournament
              </Button>
            </Link>
            <Link href="/match/setup">
              <Button size="sm" className="rounded-full gap-2 font-bold">
                <Plus className="w-4 h-4" /> New Match
              </Button>
            </Link>
          </div>
        </div>

        <TabsContent value="matches">
          {matchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-44 w-full bg-muted animate-pulse rounded-3xl" />)}
            </div>
          ) : !matches || matches.length === 0 ? (
            <Card className="border-dashed border-4 py-32 text-center flex flex-col items-center gap-8 bg-transparent rounded-[3rem]">
              <LayoutGrid className="w-16 h-16 text-muted-foreground/40" />
              <p className="text-2xl font-bold">Ready to start scoring?</p>
              <Link href="/match/setup">
                <Button size="lg" className="px-12 h-14 shadow-xl rounded-full font-black text-lg">Create Match</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <div key={match.id} className="group relative">
                  <Link href={`/match/${match.id}`}>
                    <Card className="h-full hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 hover:border-primary/40 bg-white group-hover:-translate-y-1 rounded-3xl overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest">{match.format}</span>
                            <CardTitle className="text-xl font-black text-primary mt-2">{match.teamA.name} v {match.teamB.name}</CardTitle>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold">{new Date(match.createdAt).toLocaleDateString()}</span>
                        </div>
                        {match.innings[match.currentInning - 1] && (
                          <p className="text-3xl font-black mb-4">
                            {match.innings[match.currentInning - 1]?.score}/{match.innings[match.currentInning - 1]?.wickets}
                            <span className="text-sm font-bold text-muted-foreground ml-2">({match.innings[match.currentInning - 1]?.overs}.{match.innings[match.currentInning - 1]?.ballsInOver} ov)</span>
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">{match.status === 'completed' ? match.winner + ' WON' : 'LIVE NOW'}</p>
                          <ChevronRight className="w-4 h-4 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 z-10 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMatchToDelete(match);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tournaments">
          {!tournaments || tournaments.length === 0 ? (
            <Card className="border-dashed border-4 py-32 text-center flex flex-col items-center gap-8 bg-transparent rounded-[3rem]">
              <Calendar className="w-16 h-16 text-muted-foreground/40" />
              <p className="text-2xl font-bold text-foreground/80">Launch your League</p>
              <Link href="/tournament/setup">
                <Button size="lg" className="px-12 h-14 shadow-xl rounded-full font-black text-lg">Create Tournament</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map((t) => (
                <Link key={t.id} href={`/tournament/${t.id}`}>
                  <Card className="hover:shadow-xl transition-all border-2 rounded-3xl overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="bg-primary p-6 text-white">
                        <Trophy className="w-8 h-8 mb-4 opacity-40" />
                        <h3 className="text-2xl font-black tracking-tight">{t.name}</h3>
                        <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">{t.teams.length} Teams • {t.matchIds.length} Matches</p>
                      </div>
                      <div className="p-6 flex justify-between items-center bg-white group-hover:bg-primary/5 transition-colors">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">View Standings & Stats</span>
                        <ChevronRight className="w-5 h-5 text-primary opacity-20 group-hover:opacity-100" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] w-[95%] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Delete Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              This will permanently remove the match data for <span className="text-primary font-bold">{matchToDelete?.teamA.name} vs {matchToDelete?.teamB.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl h-12 font-bold flex-1">Keep Match</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl h-12 font-black flex-1"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
