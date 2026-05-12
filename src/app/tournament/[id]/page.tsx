
"use client"

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalTournament, useLocalMatches, saveTournamentToLocalStorage, saveMatchToLocalStorage } from '@/lib/storage';
import { calculateTournamentStandings } from '@/lib/match-utils';
import { ChevronLeft, Trophy, Star, ChevronRight, Plus, PlayCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Match, Inning, Fixture, Team } from '@/types/cricket';
import { useUser } from '@/firebase';

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useUser();
  const { data: tournament, loading: tLoading } = useLocalTournament(resolvedParams.id);
  const { data: allMatches, loading: mLoading } = useLocalMatches();
  const [activeTab, setActiveTab] = useState('standings');

  if (tLoading || mLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!tournament) return <div className="min-h-screen flex items-center justify-center">Tournament Not Found</div>;

  const tournamentMatches = allMatches.filter(m => m.tournamentId === tournament.id);
  const teamNames = tournament.teams.map((t: Team | string) => typeof t === 'string' ? t : t.name);
  const standings = calculateTournamentStandings(tournamentMatches, teamNames);

  // Safely get settings
  const tSettings = tournament.settings || { overs: 20, playersPerTeam: 11, matchesPerTeam: 1 };

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

  const startFixture = (fixture: Fixture) => {
    if (!user) return;
    
    // Find team branding from tournament
    const teamAData = tournament.teams.find((t: Team | string) => (typeof t === 'string' ? t : t.name) === fixture.teamA) as Team;
    const teamBData = tournament.teams.find((t: Team | string) => (typeof t === 'string' ? t : t.name) === fixture.teamB) as Team;

    const id = Math.random().toString(36).substr(2, 9);
    const createInning = (batting: string, bowling: string): Inning => ({
      battingTeam: batting,
      bowlingTeam: bowling,
      score: 0,
      wickets: 0,
      overs: 0,
      ballsInOver: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      balls: [],
      batsmen: {},
      bowlers: {},
      fallOfWickets: []
    });

    const newMatch: Match = {
      id,
      title: `${fixture.teamA} vs ${fixture.teamB}`,
      format: 'Custom',
      oversLimit: tSettings.overs,
      teamA: { 
        name: fixture.teamA, 
        players: teamAData?.players || Array.from({length: tSettings.playersPerTeam}, (_, i) => `${fixture.teamA} Player ${i+1}`), 
        color: teamAData?.color || '#2C5A37' 
      },
      teamB: { 
        name: fixture.teamB, 
        players: teamBData?.players || Array.from({length: tSettings.playersPerTeam}, (_, i) => `${fixture.teamB} Player ${i+1}`), 
        color: teamBData?.color || '#1E40AF' 
      },
      status: 'live',
      currentInning: 1,
      innings: [createInning(fixture.teamA, fixture.teamB), null],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId: user.uid,
      tournamentId: tournament.id
    };

    // Update fixture in tournament
    const updatedFixtures = (tournament.fixtures || []).map(f => 
      f.id === fixture.id ? { ...f, matchId: id, status: 'live' as any } : f
    );
    
    saveTournamentToLocalStorage({ ...tournament, fixtures: updatedFixtures });
    saveMatchToLocalStorage(newMatch);
    router.push(`/match/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#F3FAF4] pb-24">
      <header className="bg-primary p-6 text-white text-center space-y-2">
        <div className="flex justify-between items-center mb-4">
           <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="text-white hover:bg-white/10"><ChevronLeft /></Button>
           <Trophy className="w-10 h-10 text-amber-400 opacity-60" />
           <div className="w-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter">{tournament.name}</h1>
        <div className="flex items-center justify-center gap-4 mt-2">
           <span className="text-[10px] font-bold bg-black/20 px-3 py-1 rounded-full uppercase tracking-widest">{tSettings.overs} OVERS</span>
           <span className="text-[10px] font-bold bg-black/20 px-3 py-1 rounded-full uppercase tracking-widest">{tSettings.playersPerTeam} PLAYERS</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white/50 border rounded-2xl p-1 overflow-x-auto">
            <TabsTrigger value="standings" className="rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest">Table</TabsTrigger>
            <TabsTrigger value="fixtures" className="rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest">Fixtures</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest">Results</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="standings">
            <Card className="border-2 rounded-[2rem] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
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
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="fixtures" className="space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-lg uppercase tracking-tight text-primary">Tournament Fixtures</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{ (tournament.fixtures || []).filter(f => !f.matchId).length} Upcoming</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(tournament.fixtures || []).map((f) => (
                   <Card key={f.id} className="border-2 rounded-2xl overflow-hidden group hover:shadow-lg transition-all">
                      <CardContent className="p-5 flex justify-between items-center bg-white">
                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                               <Clock className="w-3 h-3 text-muted-foreground" />
                               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Scheduled Match</span>
                            </div>
                            <h4 className="font-black text-lg text-primary">{f.teamA} <span className="text-muted-foreground/30 font-bold italic text-sm">vs</span> {f.teamB}</h4>
                         </div>
                         {f.matchId ? (
                            <Button variant="outline" size="sm" asChild className="rounded-xl border-2 font-bold h-10 px-5">
                               <Link href={`/match/${f.matchId}`}>View Match</Link>
                            </Button>
                         ) : (
                            <Button onClick={() => startFixture(f)} size="sm" className="rounded-xl font-black h-10 px-5 gap-2">
                               <PlayCircle className="w-4 h-4" /> Start
                            </Button>
                         )}
                      </CardContent>
                   </Card>
                ))}
                {(tournament.fixtures || []).length === 0 && (
                   <div className="col-span-full py-20 text-center text-muted-foreground font-black uppercase text-xs opacity-40 border-4 border-dashed rounded-[2rem]">No fixtures generated.</div>
                )}
             </div>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-black text-lg uppercase tracking-tight text-primary">Recent Results</h3>
               <Link href={`/match/setup?tournamentId=${tournament.id}`}>
                 <Button size="sm" variant="outline" className="rounded-full gap-2 font-bold border-2"><Plus className="w-4 h-4" /> Custom Match</Button>
               </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournamentMatches.filter(m => m.status === 'completed').map(m => (
                <Link key={m.id} href={`/match/${m.id}`}>
                  <Card className="hover:shadow-lg transition-all border-2 rounded-2xl group">
                    <CardContent className="p-4 flex justify-between items-center">
                       <div>
                         <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Final Result</p>
                         <h4 className="font-black text-primary">{m.teamA.name} v {m.teamB.name}</h4>
                         <p className="text-[10px] font-bold text-secondary uppercase mt-1">{m.winner === 'Tie' ? 'Match Tied' : `${m.winner} Won`}</p>
                       </div>
                       <ChevronRight className="w-5 h-5 text-primary opacity-20 group-hover:opacity-100" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {tournamentMatches.filter(m => m.status === 'completed').length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground font-black uppercase text-xs opacity-40 border-4 border-dashed rounded-[2rem]">No completed matches yet.</div>
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
