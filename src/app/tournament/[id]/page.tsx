"use client"

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalTournament, useLocalMatches } from '@/lib/storage';
import { calculateTournamentStandings } from '@/lib/match-utils';
import { ChevronLeft, Trophy, Users, LayoutGrid, Calendar, Star, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: tournament, loading: tLoading } = useLocalTournament(resolvedParams.id);
  const { data: allMatches, loading: mLoading } = useLocalMatches();

  if (tLoading || mLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!tournament) return <div className="min-h-screen flex items-center justify-center">Tournament Not Found</div>;

  const tournamentMatches = allMatches.filter(m => m.tournamentId === tournament.id || tournament.matchIds.includes(m.id));
  const standings = calculateTournamentStandings(tournamentMatches, tournament.teams);

  // Derive Leaderboards
  const playerStats: Record<string, { runs: number; wickets: number; team: string }> = {};
  tournamentMatches.forEach(m => {
    m.innings.forEach(inn => {
      if (!inn) return;
      Object.values(inn.batsmen).forEach(b => {
        if (!playerStats[b.name]) playerStats[b.name] = { runs: 0, wickets: 0, team: inn.battingTeam };
        playerStats[b.name].runs += b.runs;
      });
      Object.values(inn.bowlers).forEach(bw => {
        if (!playerStats[bw.name]) playerStats[bw.name] = { runs: 0, wickets: 0, team: inn.bowlingTeam };
        playerStats[bw.name].wickets += bw.wickets;
      });
    });
  });

  const topScorers = Object.entries(playerStats).sort((a, b) => b[1].runs - a[1].runs).slice(0, 5);
  const topWicketTakers = Object.entries(playerStats).sort((a, b) => b[1].wickets - a[1].wickets).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F3FAF4] pb-24">
      <header className="bg-primary p-6 text-white text-center space-y-2">
        <div className="flex justify-between items-center mb-4">
           <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="text-white hover:bg-white/10"><ChevronLeft /></Button>
           <Trophy className="w-10 h-10 text-amber-400 opacity-60" />
           <div className="w-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter">{tournament.name}</h1>
        <p className="text-xs font-bold opacity-60 uppercase tracking-[0.3em]">League Dashboard</p>
      </header>

      <main className="max-w-5xl mx-auto p-4 pt-8">
        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white/50 border rounded-2xl p-1">
            <TabsTrigger value="standings" className="rounded-xl font-black text-xs uppercase tracking-widest">Standings</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-xl font-black text-xs uppercase tracking-widest">Matches</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl font-black text-xs uppercase tracking-widest">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="standings">
            <Card className="border-2 rounded-[2rem] overflow-hidden shadow-xl">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase">Team</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">P</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">W</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">L</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">NRR</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((s, i) => (
                    <TableRow key={s.team} className={i < 4 ? 'bg-primary/5' : ''}>
                      <TableCell className="font-black text-primary">{s.team}</TableCell>
                      <TableCell className="text-center font-bold">{s.played}</TableCell>
                      <TableCell className="text-center font-bold text-secondary">{s.won}</TableCell>
                      <TableCell className="text-center font-bold text-destructive">{s.lost}</TableCell>
                      <TableCell className="text-center font-bold">{s.nrr.toFixed(3)}</TableCell>
                      <TableCell className="text-center font-black text-primary">{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-black text-lg uppercase tracking-tight text-primary">Fixture List</h3>
               <Link href="/match/setup">
                 <Button size="sm" className="rounded-full gap-2 font-bold"><Plus className="w-4 h-4" /> Add Match</Button>
               </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournamentMatches.map(m => (
                <Link key={m.id} href={`/match/${m.id}`}>
                  <Card className="hover:shadow-lg transition-all border-2 rounded-2xl group">
                    <CardContent className="p-4 flex justify-between items-center">
                       <div>
                         <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{m.status === 'completed' ? 'Final Result' : 'Match Details'}</p>
                         <h4 className="font-black text-primary">{m.teamA.name} v {m.teamB.name}</h4>
                         <p className="text-[10px] font-bold text-secondary uppercase mt-1">{m.winner ? `${m.winner} Won` : 'Result Pending'}</p>
                       </div>
                       <ChevronRight className="w-5 h-5 text-primary opacity-20 group-hover:opacity-100" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {tournamentMatches.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground font-black uppercase text-xs opacity-40">No matches linked to this league yet.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="border-2 rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-amber-500 text-white"><CardTitle className="text-lg font-black flex items-center gap-2"><Star className="w-5 h-5" /> Orange Cap</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {topScorers.map(([name, stats], i) => (
                          <TableRow key={name}>
                            <TableCell className="font-bold text-xs"><span className="opacity-40 mr-2">{i+1}</span>{name}</TableCell>
                            <TableCell className="text-right font-black">{stats.runs} <span className="text-[10px] opacity-40">RUNS</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>

               <Card className="border-2 rounded-[2rem] overflow-hidden">
                 <CardHeader className="bg-primary text-white"><CardTitle className="text-lg font-black flex items-center gap-2"><Trophy className="w-5 h-5" /> Purple Cap</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {topWicketTakers.map(([name, stats], i) => (
                          <TableRow key={name}>
                            <TableCell className="font-bold text-xs"><span className="opacity-40 mr-2">{i+1}</span>{name}</TableCell>
                            <TableCell className="text-right font-black">{stats.wickets} <span className="text-[10px] opacity-40">WICKETS</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
