
"use client"

import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalTournament, useLocalMatches, saveTournamentToLocalStorage, saveMatchToLocalStorage } from '@/lib/storage';
import { calculateTournamentStandings } from '@/lib/match-utils';
import { ChevronLeft, Trophy, Star, ChevronRight, Plus, PlayCircle, Clock, Zap, Target, Award, Flame } from 'lucide-react';
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

  // Memoize tournament-specific matches and names
  const tournamentMatches = useMemo(() => 
    allMatches.filter(m => m.tournamentId === tournament?.id),
    [allMatches, tournament?.id]
  );
  
  const teamNames = useMemo(() => 
    tournament?.teams.map((t: Team | string) => typeof t === 'string' ? t : t.name) || [],
    [tournament?.teams]
  );

  const standings = useMemo(() => 
    calculateTournamentStandings(tournamentMatches, teamNames),
    [tournamentMatches, teamNames]
  );

  // Memoize heavy player statistics calculations
  const playerStats = useMemo(() => {
    const stats: Record<string, { runs: number; wickets: number; team: string; sixes: number; fours: number; balls: number }> = {};
    const innings: Array<{ name: string; runs: number; balls: number; team: string }> = [];
    const spells: Array<{ name: string; wickets: number; runsConceded: number; team: string }> = [];

    tournamentMatches.forEach(m => {
      m.innings.forEach(inn => {
        if (!inn) return;
        Object.values(inn.batsmen).forEach(b => {
          if (!stats[b.id]) stats[b.id] = { runs: 0, wickets: 0, team: inn.battingTeam, sixes: 0, fours: 0, balls: 0 };
          stats[b.id].runs += b.runs;
          stats[b.id].sixes += (b.sixes || 0);
          stats[b.id].fours += (b.fours || 0);
          stats[b.id].balls += (b.balls || 0);
          if (b.balls > 0) innings.push({ name: b.name, runs: b.runs, balls: b.balls, team: inn.battingTeam });
        });
        Object.values(inn.bowlers).forEach(bw => {
          if (!stats[bw.id]) stats[bw.id] = { runs: 0, wickets: 0, team: inn.bowlingTeam, sixes: 0, fours: 0, balls: 0 };
          stats[bw.id].wickets += bw.wickets;
          const totalBalls = (bw.overs * 6) + bw.balls;
          if (totalBalls > 0) spells.push({ name: bw.name, wickets: bw.wickets, runsConceded: bw.runsConceded, team: inn.bowlingTeam });
        });
      });
    });

    const entries = Object.entries(stats);
    return {
      topScorers: entries.sort((a, b) => b[1].runs - a[1].runs).slice(0, 5),
      topWicketTakers: entries.sort((a, b) => b[1].wickets - a[1].wickets).slice(0, 5),
      highestInnings: innings.sort((a, b) => b.runs - a.runs).slice(0, 5),
      bestSpells: spells.sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded).slice(0, 5),
      topStrikeRates: entries
        .filter(([_, s]) => s.balls >= 10)
        .map(([id, s]) => ({ id, name: s.team, sr: parseFloat(((s.runs / s.balls) * 100).toFixed(2)), ...s }))
        .sort((a, b) => b.sr - a.sr)
        .slice(0, 5),
      boundaryKings: entries
        .sort((a, b) => (b[1].sixes * 6 + b[1].fours * 4) - (a[1].sixes * 6 + a[1].fours * 4))
        .slice(0, 5)
    };
  }, [tournamentMatches]);

  if (tLoading || mLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!tournament) return <div className="min-h-screen flex items-center justify-center">Tournament Not Found</div>;

  const tSettings = tournament.settings || { overs: 20, playersPerTeam: 11, matchesPerTeam: 1 };

  const startFixture = (fixture: Fixture) => {
    if (!user) return;
    const teamAData = tournament.teams.find((t: Team | string) => (typeof t === 'string' ? t : t.name) === fixture.teamA) as Team;
    const teamBData = tournament.teams.find((t: Team | string) => (typeof t === 'string' ? t : t.name) === fixture.teamB) as Team;

    const id = Math.random().toString(36).substr(2, 9);
    const createInning = (batting: string, bowling: string): Inning => ({
      battingTeam: batting, bowlingTeam: bowling, score: 0, wickets: 0, overs: 0, ballsInOver: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      balls: [], batsmen: {}, bowlers: {}, fallOfWickets: []
    });

    const newMatch: Match = {
      id, title: `${fixture.teamA} vs ${fixture.teamB}`, format: 'Custom',
      oversLimit: tSettings.overs,
      teamA: { name: fixture.teamA, players: teamAData?.players || [], color: teamAData?.color || '#2C5A37' },
      teamB: { name: fixture.teamB, players: teamBData?.players || [], color: teamBData?.color || '#1E40AF' },
      status: 'live', currentInning: 1, innings: [createInning(fixture.teamA, fixture.teamB), null],
      createdAt: Date.now(), updatedAt: Date.now(), ownerId: user.uid, tournamentId: tournament.id
    };

    const updatedFixtures = (tournament.fixtures || []).map(f => f.id === fixture.id ? { ...f, matchId: id, status: 'live' as any } : f);
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
      </header>

      <main className="max-w-5xl mx-auto p-4 pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white/50 border rounded-2xl p-1">
            <TabsTrigger value="standings" className="rounded-xl font-black text-[10px] sm:text-xs">Table</TabsTrigger>
            <TabsTrigger value="fixtures" className="rounded-xl font-black text-[10px] sm:text-xs">Fixtures</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-xl font-black text-[10px] sm:text-xs">Results</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl font-black text-[10px] sm:text-xs">Stats</TabsTrigger>
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

          <TabsContent value="fixtures">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(tournament.fixtures || []).map((f) => (
                   <Card key={f.id} className="border-2 rounded-2xl p-5 flex justify-between items-center bg-white">
                      <div>
                        <h4 className="font-black text-lg text-primary">{f.teamA} v {f.teamB}</h4>
                      </div>
                      {f.matchId ? <Button variant="outline" asChild><Link href={`/match/${f.matchId}`}>View</Link></Button> : <Button onClick={() => startFixture(f)}>Start</Button>}
                   </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Card className="border-2 rounded-[1.5rem] overflow-hidden">
                 <CardHeader className="bg-amber-500 text-white p-4"><CardTitle className="text-sm font-black flex items-center gap-2"><Star className="w-4 h-4" /> Orange Cap</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {playerStats.topScorers.map(([id, s], i) => (
                          <TableRow key={id}><TableCell className="p-3 font-bold text-xs">{s.team}</TableCell><TableCell className="p-3 text-right font-black">{s.runs}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>
               <Card className="border-2 rounded-[1.5rem] overflow-hidden">
                 <CardHeader className="bg-primary text-white p-4"><CardTitle className="text-sm font-black flex items-center gap-2"><Trophy className="w-4 h-4" /> Purple Cap</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {playerStats.topWicketTakers.map(([id, s], i) => (
                          <TableRow key={id}><TableCell className="p-3 font-bold text-xs">{s.team}</TableCell><TableCell className="p-3 text-right font-black">{s.wickets}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>
               <Card className="border-2 rounded-[1.5rem] overflow-hidden">
                 <CardHeader className="bg-slate-800 text-white p-4"><CardTitle className="text-sm font-black flex items-center gap-2"><Award className="w-4 h-4" /> Boundary Kings</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {playerStats.boundaryKings.map(([id, s]) => (
                          <TableRow key={id}><TableCell className="p-3 font-bold text-xs">{s.team}</TableCell><TableCell className="p-3 text-right font-black">{s.sixes}s / {s.fours}f</TableCell></TableRow>
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
