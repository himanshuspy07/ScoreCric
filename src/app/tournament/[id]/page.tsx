
"use client"

import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLocalTournament, useLocalMatches, saveTournamentToLocalStorage, saveMatchToLocalStorage } from '@/lib/storage';
import { calculateTournamentStandings } from '@/lib/match-utils';
import { ChevronLeft, Trophy, Star, ChevronRight, Plus, Calendar, Activity, Award, Swords } from 'lucide-react';
import Link from 'next/link';
import { Match, Inning, Fixture, Team, FixtureRound } from '@/types/cricket';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const { data: tournament, loading: tLoading } = useLocalTournament(resolvedParams.id);
  const { data: allMatches, loading: mLoading } = useLocalMatches();
  const [activeTab, setActiveTab] = useState('standings');
  
  // Custom Fixture State
  const [isAddFixtureOpen, setIsAddFixtureOpen] = useState(false);
  const [customTeamA, setCustomTeamA] = useState('');
  const [customTeamB, setCustomTeamB] = useState('');
  const [customRound, setCustomRound] = useState<FixtureRound>('group');

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
    const stats: Record<string, { name: string; runs: number; wickets: number; team: string; sixes: number; fours: number; balls: number }> = {};

    tournamentMatches.forEach(m => {
      m.innings.forEach(inn => {
        if (!inn) return;
        Object.values(inn.batsmen).forEach(b => {
          if (!stats[b.id]) stats[b.id] = { name: b.name, runs: 0, wickets: 0, team: inn.battingTeam, sixes: 0, fours: 0, balls: 0 };
          stats[b.id].runs += b.runs;
          stats[b.id].sixes += (b.sixes || 0);
          stats[b.id].fours += (b.fours || 0);
          stats[b.id].balls += (b.balls || 0);
        });
        Object.values(inn.bowlers).forEach(bw => {
          if (!stats[bw.id]) stats[bw.id] = { name: bw.name, runs: 0, wickets: 0, team: inn.bowlingTeam, sixes: 0, fours: 0, balls: 0 };
          stats[bw.id].wickets += bw.wickets;
        });
      });
    });

    const entries = Object.entries(stats);
    return {
      topScorers: entries.sort((a, b) => b[1].runs - a[1].runs).slice(0, 5),
      topWicketTakers: entries.sort((a, b) => b[1].wickets - a[1].wickets).slice(0, 5),
      boundaryKings: entries
        .sort((a, b) => (b[1].sixes * 6 + b[1].fours * 4) - (a[1].sixes * 6 + a[1].fours * 4))
        .slice(0, 5)
    };
  }, [tournamentMatches]);

  if (tLoading || mLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!tournament) return <div className="min-h-screen flex items-center justify-center">Tournament Not Found</div>;

  const tSettings = tournament.settings || { overs: 20, playersPerTeam: 11, matchesPerTeam: 1 };

  const addCustomFixture = () => {
    if (!customTeamA || !customTeamB) {
      toast({ variant: "destructive", title: "Missing Teams", description: "Select both teams for the match." });
      return;
    }
    if (customTeamA === customTeamB) {
      toast({ variant: "destructive", title: "Invalid Selection", description: "Teams must be different." });
      return;
    }

    const newFixture: Fixture = {
      id: Math.random().toString(36).substr(2, 9),
      teamA: customTeamA,
      teamB: customTeamB,
      status: 'pending',
      round: customRound
    };

    const updatedTournament = {
      ...tournament,
      fixtures: [...(tournament.fixtures || []), newFixture]
    };

    saveTournamentToLocalStorage(updatedTournament);
    setIsAddFixtureOpen(false);
    setCustomTeamA('');
    setCustomTeamB('');
    setCustomRound('group');
    toast({ title: "Match Added", description: `${customRound.toUpperCase()} match registered.` });
  };

  const startFixture = (fixture: Fixture) => {
    if (!user) {
      toast({ title: "Identity Required", description: "Please sign in to start matches." });
      return;
    }
    const teamAData = tournament.teams.find((t: Team | string) => (typeof t === 'string' ? t : t.name) === fixture.teamA) as Team;
    const teamBData = tournament.teams.find((t: Team | string) => (typeof t === 'string' ? t : t.name) === fixture.teamB) as Team;

    const id = Math.random().toString(36).substr(2, 9);
    const createInning = (batting: string, bowling: string): Inning => ({
      battingTeam: batting, bowlingTeam: bowling, score: 0, wickets: 0, overs: 0, ballsInOver: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      balls: [], batsmen: {}, bowlers: {}, fallOfWickets: []
    });

    const newMatch: Match = {
      id, title: `${fixture.round?.toUpperCase() || 'GROUP'}: ${fixture.teamA} vs ${fixture.teamB}`, format: 'Custom',
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

  const groupedFixtures = useMemo(() => {
    const group: Fixture[] = [];
    const semis: Fixture[] = [];
    const finals: Fixture[] = [];
    
    (tournament.fixtures || []).forEach(f => {
      if (f.round === 'semi-final') semis.push(f);
      else if (f.round === 'final') finals.push(f);
      else group.push(f);
    });
    
    return { group, semis, finals };
  }, [tournament.fixtures]);

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

          <TabsContent value="fixtures" className="space-y-10">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-lg font-black text-primary uppercase tracking-tighter">Fixtures & Schedule</h3>
                <Button onClick={() => setIsAddFixtureOpen(true)} size="sm" className="rounded-full gap-2 font-bold shadow-lg">
                   <Plus className="w-4 h-4" /> Add Match
                </Button>
             </div>

             {/* Finals */}
             {groupedFixtures.finals.length > 0 && (
               <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-black text-amber-600 uppercase tracking-widest px-2"><Trophy className="w-4 h-4" /> Grand Final</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedFixtures.finals.map(f => (
                      <FixtureCard key={f.id} fixture={f} onStart={() => startFixture(f)} />
                    ))}
                  </div>
               </div>
             )}

             {/* Semis */}
             {groupedFixtures.semis.length > 0 && (
               <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-black text-primary/60 uppercase tracking-widest px-2"><Swords className="w-4 h-4" /> Semi Finals</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedFixtures.semis.map(f => (
                      <FixtureCard key={f.id} fixture={f} onStart={() => startFixture(f)} />
                    ))}
                  </div>
               </div>
             )}

             {/* Group Stage */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest px-2">Group Stage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedFixtures.group.map(f => (
                    <FixtureCard key={f.id} fixture={f} onStart={() => startFixture(f)} />
                  ))}
                  {groupedFixtures.group.length === 0 && groupedFixtures.semis.length === 0 && groupedFixtures.finals.length === 0 && (
                    <div className="col-span-full py-20 border-4 border-dashed rounded-[2.5rem] text-center text-muted-foreground font-bold flex flex-col items-center gap-3">
                        <Activity className="w-10 h-10 opacity-20" />
                        <p>No fixtures found. Generate or add a match.</p>
                        <Button onClick={() => setIsAddFixtureOpen(true)} variant="outline" className="mt-2 rounded-full font-bold">Add Custom Match</Button>
                    </div>
                  )}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="matches">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournamentMatches.length === 0 ? (
                  <Card className="col-span-full border-dashed border-4 py-20 text-center flex flex-col items-center gap-4 bg-transparent rounded-3xl opacity-40">
                    <Calendar className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-lg font-bold text-muted-foreground">No matches recorded in this league.</p>
                  </Card>
                ) : (
                  tournamentMatches.map((match) => (
                    <Link key={match.id} href={`/match/${match.id}`}>
                      <Card className="hover:shadow-xl transition-all border-2 rounded-3xl overflow-hidden bg-white group">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest">{match.format}</span>
                              <h3 className="text-xl font-black text-primary mt-2">{match.teamA.name} v {match.teamB.name}</h3>
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
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">{match.status === 'completed' ? match.winner + ' Won' : 'LIVE NOW'}</p>
                            <ChevronRight className="w-4 h-4 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
             </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Card className="border-2 rounded-[1.5rem] overflow-hidden shadow-sm">
                 <CardHeader className="bg-amber-500 text-white p-4"><CardTitle className="text-sm font-black flex items-center gap-2"><Star className="w-4 h-4" /> Orange Cap</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {playerStats.topScorers.map(([id, s]) => (
                          <TableRow key={id}>
                            <TableCell className="p-3">
                              <p className="font-black text-sm">{s.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.team}</p>
                            </TableCell>
                            <TableCell className="p-3 text-right font-black text-lg">{s.runs}</TableCell>
                          </TableRow>
                        ))}
                        {playerStats.topScorers.length === 0 && <TableRow><TableCell className="text-center py-8 text-muted-foreground opacity-40 font-bold">No Data</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>

               <Card className="border-2 rounded-[1.5rem] overflow-hidden shadow-sm">
                 <CardHeader className="bg-primary text-white p-4"><CardTitle className="text-sm font-black flex items-center gap-2"><Trophy className="w-4 h-4" /> Purple Cap</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {playerStats.topWicketTakers.map(([id, s]) => (
                          <TableRow key={id}>
                            <TableCell className="p-3">
                              <p className="font-black text-sm">{s.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.team}</p>
                            </TableCell>
                            <TableCell className="p-3 text-right font-black text-lg">{s.wickets}</TableCell>
                          </TableRow>
                        ))}
                        {playerStats.topWicketTakers.length === 0 && <TableRow><TableCell className="text-center py-8 text-muted-foreground opacity-40 font-bold">No Data</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>

               <Card className="border-2 rounded-[1.5rem] overflow-hidden shadow-sm">
                 <CardHeader className="bg-slate-800 text-white p-4"><CardTitle className="text-sm font-black flex items-center gap-2"><Award className="w-4 h-4" /> Boundary Kings</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {playerStats.boundaryKings.map(([id, s]) => (
                          <TableRow key={id}>
                            <TableCell className="p-3">
                              <p className="font-black text-sm">{s.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.team}</p>
                            </TableCell>
                            <TableCell className="p-3 text-right font-black text-sm">
                              {s.sixes} <span className="text-[10px] text-muted-foreground font-bold">6s</span> / {s.fours} <span className="text-[10px] text-muted-foreground font-bold">4s</span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {playerStats.boundaryKings.length === 0 && <TableRow><TableCell className="text-center py-8 text-muted-foreground opacity-40 font-bold">No Data</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isAddFixtureOpen} onOpenChange={setIsAddFixtureOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary">Schedule New Match</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest">Configure teams and round type</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tournament Round</Label>
               <Select value={customRound} onValueChange={(v) => setCustomRound(v as FixtureRound)}>
                 <SelectTrigger className="h-14 rounded-2xl border-2 font-bold text-lg">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl">
                    <SelectItem value="group" className="font-bold">Group Stage</SelectItem>
                    <SelectItem value="semi-final" className="font-bold">Semi-Final</SelectItem>
                    <SelectItem value="final" className="font-bold">Final</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Team A (Home)</Label>
               <Select value={customTeamA} onValueChange={setCustomTeamA}>
                 <SelectTrigger className="h-14 rounded-2xl border-2 font-bold text-lg">
                   <SelectValue placeholder="Select Team A" />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl">
                    {teamNames.map(name => (
                      <SelectItem key={name} value={name} className="font-bold">{name}</SelectItem>
                    ))}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Team B (Away)</Label>
               <Select value={customTeamB} onValueChange={setCustomTeamB}>
                 <SelectTrigger className="h-14 rounded-2xl border-2 font-bold text-lg">
                   <SelectValue placeholder="Select Team B" />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl">
                    {teamNames.map(name => (
                      <SelectItem key={name} value={name} className="font-bold" disabled={name === customTeamA}>{name}</SelectItem>
                    ))}
                 </SelectContent>
               </Select>
            </div>
          </div>
          <DialogFooter className="gap-3">
             <Button variant="outline" onClick={() => setIsAddFixtureOpen(false)} className="h-12 rounded-xl font-bold flex-1">Cancel</Button>
             <Button onClick={addCustomFixture} className="h-12 rounded-xl font-black flex-1">Register Match</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FixtureCard({ fixture, onStart }: { fixture: Fixture, onStart: () => void }) {
  return (
    <Card className="border-2 rounded-2xl p-5 flex justify-between items-center bg-white shadow-sm hover:border-primary/20 transition-colors">
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{fixture.matchId ? 'Ongoing / Played' : 'Ready to Start'}</p>
        <h4 className="font-black text-lg text-primary">{fixture.teamA} v {fixture.teamB}</h4>
      </div>
      {fixture.matchId ? (
        <Button variant="outline" asChild className="rounded-xl font-bold">
           <Link href={`/match/${fixture.matchId}`}>View Card</Link>
        </Button>
      ) : (
        <Button onClick={onStart} className="rounded-xl font-bold px-6">Start</Button>
      )}
    </Card>
  );
}
