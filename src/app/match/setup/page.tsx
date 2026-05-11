
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Palette, Users, History, AlertCircle } from 'lucide-react';
import { saveMatchToFirestore } from '@/lib/storage';
import { Match, Inning } from '@/types/cricket';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';

const TEAM_COLORS = [
  { name: 'Forest Green', value: '#2C5A37' },
  { name: 'Royal Blue', value: '#1E40AF' },
  { name: 'Amber Gold', value: '#B45309' },
  { name: 'Crimson Red', value: '#B91C1C' },
  { name: 'Midnight Purple', value: '#581C87' },
  { name: 'Sleek Black', value: '#18181B' },
];

export default function MatchSetup() {
  const router = useRouter();
  const db = useFirestore();
  const { user, signInWithGoogle } = useUser();
  const [step, setStep] = useState(1);

  const pastMatchesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), orderBy('updatedAt', 'desc'), limit(10));
  }, [db]);
  const { data: pastMatches } = useCollection<Match>(pastMatchesQuery);

  const pastTeams = React.useMemo(() => {
    if (!pastMatches) return [];
    const teamsMap = new Map<string, string[]>();
    pastMatches.forEach(m => {
      teamsMap.set(m.teamA.name, m.teamA.players);
      teamsMap.set(m.teamB.name, m.teamB.players);
    });
    return Array.from(teamsMap.entries()).map(([name, players]) => ({ name, players }));
  }, [pastMatches]);

  const [matchInfo, setMatchInfo] = useState({
    title: '',
    format: 'T20',
    overs: '20',
    playerCount: 11,
    teamAName: 'Team A',
    teamBName: 'Team B',
    teamAColor: '#2C5A37',
    teamBColor: '#1E40AF',
    teamAPlayers: Array.from({length: 11}, (_, i) => `A Player ${i+1}`),
    teamBPlayers: Array.from({length: 11}, (_, i) => `B Player ${i+1}`),
    tossWinner: 'teamA',
    tossChoice: 'bat',
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 border-2">
          <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">You need to be signed in to host and score live matches across the internet.</p>
          <Button onClick={() => signInWithGoogle()} className="w-full h-12 rounded-xl font-bold">
            Sign In with Google
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')} className="w-full mt-2">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFormatChange = (format: string) => {
    let overs = matchInfo.overs;
    if (format === 'T20') overs = '20';
    else if (format === 'ODI') overs = '50';
    setMatchInfo({ ...matchInfo, format, overs });
  };

  const handlePlayerCountChange = (count: number) => {
    const safeCount = Math.max(1, Math.min(22, count));
    const newTeamAPlayers = Array.from({ length: safeCount }, (_, i) => 
      matchInfo.teamAPlayers[i] || `A Player ${i + 1}`
    );
    const newTeamBPlayers = Array.from({ length: safeCount }, (_, i) => 
      matchInfo.teamBPlayers[i] || `B Player ${i + 1}`
    );
    setMatchInfo({ ...matchInfo, playerCount: safeCount, teamAPlayers: newTeamAPlayers, teamBPlayers: newTeamBPlayers });
  };

  const handlePlayerNameChange = (team: 'A' | 'B', index: number, value: string) => {
    if (team === 'A') {
      const newPlayers = [...matchInfo.teamAPlayers];
      newPlayers[index] = value;
      setMatchInfo({ ...matchInfo, teamAPlayers: newPlayers });
    } else {
      const newPlayers = [...matchInfo.teamBPlayers];
      newPlayers[index] = value;
      setMatchInfo({ ...matchInfo, teamBPlayers: newPlayers });
    }
  };

  const handleImport = (team: 'A' | 'B', players: string[]) => {
    const count = matchInfo.playerCount;
    const newPlayers = Array.from({ length: count }, (_, i) => players[i] || `${team} Player ${i + 1}`);
    if (team === 'A') setMatchInfo(prev => ({ ...prev, teamAPlayers: newPlayers }));
    else setMatchInfo(prev => ({ ...prev, teamBPlayers: newPlayers }));
  };

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

  const handleSubmit = () => {
    if (!db || !user) return;

    const id = Math.random().toString(36).substr(2, 9);
    const battingTeam = matchInfo.tossWinner === 'teamA' 
      ? (matchInfo.tossChoice === 'bat' ? matchInfo.teamAName : matchInfo.teamBName)
      : (matchInfo.tossChoice === 'bat' ? matchInfo.teamBName : matchInfo.teamAName);
    
    const bowlingTeam = battingTeam === matchInfo.teamAName ? matchInfo.teamBName : matchInfo.teamAName;

    const newMatch: Match = {
      id,
      title: matchInfo.title || `${matchInfo.teamAName} vs ${matchInfo.teamBName}`,
      format: matchInfo.format as any,
      oversLimit: parseInt(matchInfo.overs),
      teamA: { name: matchInfo.teamAName, players: matchInfo.teamAPlayers, color: matchInfo.teamAColor },
      teamB: { name: matchInfo.teamBName, players: matchInfo.teamBPlayers, color: matchInfo.teamBColor },
      tossWinner: matchInfo.tossWinner === 'teamA' ? matchInfo.teamAName : matchInfo.teamBName,
      tossChoice: matchInfo.tossChoice as any,
      status: 'live',
      currentInning: 1,
      innings: [createInning(battingTeam, bowlingTeam), null],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId: user.uid
    };

    saveMatchToFirestore(db, newMatch);
    router.push(`/match/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 pt-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Match Setup</h1>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary">
            {step === 1 && "Match Details"}
            {step === 2 && "Teams & Branding"}
            {step === 3 && "Squad List"}
            {step === 4 && "The Toss"}
          </CardTitle>
          <CardDescription>Step {step} of 4</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Match Name</Label>
                <Input id="title" placeholder="e.g. Weekend Cup Final" value={matchInfo.title} onChange={e => setMatchInfo({...matchInfo, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={matchInfo.format} onValueChange={handleFormatChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T20">T20 (20 Overs)</SelectItem>
                      <SelectItem value="ODI">ODI (50 Overs)</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Overs Limit</Label>
                  <Input type="number" value={matchInfo.overs} disabled={matchInfo.format !== 'Custom'} onChange={e => setMatchInfo({...matchInfo, overs: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Players Per Side</Label>
                <Input type="number" min={1} max={22} value={matchInfo.playerCount} onChange={e => handlePlayerCountChange(parseInt(e.target.value) || 11)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-base font-black">TEAM A</Label>
                <Input placeholder="Team A Name" value={matchInfo.teamAName} onChange={e => setMatchInfo({...matchInfo, teamAName: e.target.value})} className="font-bold h-12" />
                <div className="grid grid-cols-6 gap-2">
                  {TEAM_COLORS.map(color => (
                    <button key={color.value} onClick={() => setMatchInfo({...matchInfo, teamAColor: color.value})} className={`w-full aspect-square rounded-full border-2 transition-transform ${matchInfo.teamAColor === color.value ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'hover:scale-105 opacity-80'}`} style={{ backgroundColor: color.value }} />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-black">TEAM B</Label>
                <Input placeholder="Team B Name" value={matchInfo.teamBName} onChange={e => setMatchInfo({...matchInfo, teamBName: e.target.value})} className="font-bold h-12" />
                <div className="grid grid-cols-6 gap-2">
                  {TEAM_COLORS.map(color => (
                    <button key={color.value} onClick={() => setMatchInfo({...matchInfo, teamBColor: color.value})} className={`w-full aspect-square rounded-full border-2 transition-transform ${matchInfo.teamBColor === color.value ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'hover:scale-105 opacity-80'}`} style={{ backgroundColor: color.value }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <Tabs defaultValue="teamA" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted p-1 h-12 rounded-xl">
                <TabsTrigger value="teamA" className="font-bold">{matchInfo.teamAName}</TabsTrigger>
                <TabsTrigger value="teamB" className="font-bold">{matchInfo.teamBName}</TabsTrigger>
              </TabsList>
              <TabsContent value="teamA" className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-muted-foreground">Squad List</span>
                  {pastTeams.length > 0 && (
                    <Select onValueChange={(val) => {
                      const selected = pastTeams.find(t => t.name === val);
                      if (selected) handleImport('A', selected.players);
                    }}>
                      <SelectTrigger className="w-[140px] h-7 text-[10px]"><History className="w-3 h-3 mr-1" /><SelectValue placeholder="Import Recent" /></SelectTrigger>
                      <SelectContent>{pastTeams.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-2">
                    {matchInfo.teamAPlayers.map((name, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-black w-6 text-right">{i + 1}</span>
                        <Input value={name} onChange={(e) => handlePlayerNameChange('A', i, e.target.value)} className="h-9 border-2" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="teamB" className="space-y-4">
                 <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-muted-foreground">Squad List</span>
                  {pastTeams.length > 0 && (
                    <Select onValueChange={(val) => {
                      const selected = pastTeams.find(t => t.name === val);
                      if (selected) handleImport('B', selected.players);
                    }}>
                      <SelectTrigger className="w-[140px] h-7 text-[10px]"><History className="w-3 h-3 mr-1" /><SelectValue placeholder="Import Recent" /></SelectTrigger>
                      <SelectContent>{pastTeams.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-2">
                    {matchInfo.teamBPlayers.map((name, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-black w-6 text-right">{i + 1}</span>
                        <Input value={name} onChange={(e) => handlePlayerNameChange('B', i, e.target.value)} className="h-9 border-2" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-lg font-black block text-center">Toss Winner</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => setMatchInfo({...matchInfo, tossWinner: 'teamA'})} className={`p-4 border-2 rounded-2xl cursor-pointer text-center ${matchInfo.tossWinner === 'teamA' ? 'border-primary bg-primary/5' : ''}`}>
                    <span className="font-black text-sm uppercase">{matchInfo.teamAName}</span>
                  </div>
                  <div onClick={() => setMatchInfo({...matchInfo, tossWinner: 'teamB'})} className={`p-4 border-2 rounded-2xl cursor-pointer text-center ${matchInfo.tossWinner === 'teamB' ? 'border-primary bg-primary/5' : ''}`}>
                    <span className="font-black text-sm uppercase">{matchInfo.teamBName}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-lg font-black block text-center">Elected To</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => setMatchInfo({...matchInfo, tossChoice: 'bat'})} className={`p-4 border-2 rounded-2xl cursor-pointer text-center ${matchInfo.tossChoice === 'bat' ? 'border-primary bg-primary/5' : ''}`}>
                    <span className="font-black text-sm uppercase">BAT</span>
                  </div>
                  <div onClick={() => setMatchInfo({...matchInfo, tossChoice: 'bowl'})} className={`p-4 border-2 rounded-2xl cursor-pointer text-center ${matchInfo.tossChoice === 'bowl' ? 'border-primary bg-primary/5' : ''}`}>
                    <span className="font-black text-sm uppercase">BOWL</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4">
        {step > 1 ? <Button variant="outline" onClick={handleBack} className="flex-1 h-14 rounded-2xl font-bold">Back</Button> : <Button variant="outline" onClick={() => router.push('/')} className="flex-1 h-14 rounded-2xl font-bold">Cancel</Button>}
        {step < 4 ? <Button onClick={handleNext} className="flex-1 h-14 rounded-2xl font-bold">Next Step</Button> : <Button onClick={handleSubmit} className="flex-1 h-14 bg-secondary text-white rounded-2xl font-black">Start Match</Button>}
      </div>
    </div>
  );
}
