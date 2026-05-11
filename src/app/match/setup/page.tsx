"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Palette, History, AlertCircle, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { saveMatchToLocalStorage, useLocalMatches } from '@/lib/storage';
import { Match, Inning } from '@/types/cricket';
import { useUser } from '@/firebase';
import { generateTeamLogo } from '@/ai/flows/team-branding';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

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
  const { user, signInWithGoogle } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [generatingLogo, setGeneratingLogo] = useState<'A' | 'B' | null>(null);

  const { data: pastMatches } = useLocalMatches();

  const pastTeams = React.useMemo(() => {
    if (!pastMatches) return [];
    const teamsMap = new Map<string, { players: string[], color: string, logoUrl?: string }>();
    pastMatches.forEach(m => {
      teamsMap.set(m.teamA.name, { players: m.teamA.players, color: m.teamA.color || '', logoUrl: m.teamA.logoUrl });
      teamsMap.set(m.teamB.name, { players: m.teamB.players, color: m.teamB.color || '', logoUrl: m.teamB.logoUrl });
    });
    return Array.from(teamsMap.entries()).map(([name, data]) => ({ name, ...data }));
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
    teamALogo: '',
    teamBLogo: '',
    teamAPlayers: Array.from({length: 11}, (_, i) => `A Player ${i+1}`),
    teamBPlayers: Array.from({length: 11}, (_, i) => `B Player ${i+1}`),
    tossWinner: 'teamA',
    tossChoice: 'bat',
  });

  const handleLogoGeneration = async (team: 'A' | 'B') => {
    setGeneratingLogo(team);
    try {
      const name = team === 'A' ? matchInfo.teamAName : matchInfo.teamBName;
      const colorVal = team === 'A' ? matchInfo.teamAColor : matchInfo.teamBColor;
      const colorObj = TEAM_COLORS.find(c => c.value === colorVal);
      
      const logoUrl = await generateTeamLogo({
        teamName: name,
        colorName: colorObj?.name || 'Green'
      });
      
      setMatchInfo(prev => ({
        ...prev,
        [team === 'A' ? 'teamALogo' : 'teamBLogo']: logoUrl
      }));
    } catch (error: any) {
      console.error("Logo generation failed", error);
      
      const isBillingError = error.message?.includes('AI_BILLING_REQUIRED') || 
                             error.message?.includes('paid plans') || 
                             error.message?.includes('billing');

      toast({
        variant: "destructive",
        title: isBillingError ? "Upgrade Required" : "Generation Failed",
        description: isBillingError 
          ? "AI Logo generation requires a paid Google AI / Firebase plan. Please upgrade in your Firebase Console."
          : "Could not generate team logo. Please try again later.",
      });
    } finally {
      setGeneratingLogo(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 border-2 shadow-2xl rounded-[2.5rem]">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tighter">Identity Required</h2>
          <p className="text-muted-foreground font-medium mb-8">Sign in to manage your local matches with your profile. Your progress is saved automatically.</p>
          <Button onClick={() => signInWithGoogle()} className="w-full h-14 rounded-2xl font-black text-lg shadow-lg">
            Sign In with Google
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')} className="w-full mt-4 font-bold text-muted-foreground">
            Cancel and Go Back
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
      teamA: { name: matchInfo.teamAName, players: matchInfo.teamAPlayers, color: matchInfo.teamAColor, logoUrl: matchInfo.teamALogo },
      teamB: { name: matchInfo.teamBName, players: matchInfo.teamBPlayers, color: matchInfo.teamBColor, logoUrl: matchInfo.teamBLogo },
      tossWinner: matchInfo.tossWinner === 'teamA' ? matchInfo.teamAName : matchInfo.teamBName,
      tossChoice: matchInfo.tossChoice as any,
      status: 'live',
      currentInning: 1,
      innings: [createInning(battingTeam, bowlingTeam), null],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId: user?.uid || 'local-user'
    };

    saveMatchToLocalStorage(newMatch);
    router.push(`/match/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 pt-8 md:pt-16 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-2xl shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-headline tracking-tighter text-primary">Match Setup</h1>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Professional Scoring Configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {[1, 2, 3, 4].map((s) => (
             <div key={s} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
           ))}
        </div>
      </div>

      <Card className="border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/5 py-8 px-8 border-b border-primary/10">
          <div className="flex items-center gap-3">
             <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">{step}</span>
             <div>
                <CardTitle className="text-2xl font-black text-primary">
                  {step === 1 && "Match Intelligence"}
                  {step === 2 && "Branding & AI Logos"}
                  {step === 3 && "Professional Squads"}
                  {step === 4 && "The Official Toss"}
                </CardTitle>
                <CardDescription className="text-sm font-bold opacity-60 uppercase tracking-widest mt-0.5">Configuration Sequence</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-full">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tournament/Match Name</Label>
                <Input id="title" placeholder="e.g. Weekend Cup Final" value={matchInfo.title} onChange={e => setMatchInfo({...matchInfo, title: e.target.value})} className="h-14 rounded-2xl border-2 focus:ring-primary font-bold text-lg" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Match Format</Label>
                <Select value={matchInfo.format} onValueChange={handleFormatChange}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold text-lg"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="T20" className="font-bold">T20 (20 Overs)</SelectItem>
                    <SelectItem value="ODI" className="font-bold">ODI (50 Overs)</SelectItem>
                    <SelectItem value="Custom" className="font-bold">Custom Format</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Overs Per Inning</Label>
                <Input type="number" value={matchInfo.overs} disabled={matchInfo.format !== 'Custom'} onChange={e => setMatchInfo({...matchInfo, overs: e.target.value})} className="h-14 rounded-2xl border-2 font-bold text-lg" />
              </div>
              <div className="space-y-3 col-span-full">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Players Per Side</Label>
                <Input type="number" min={1} max={22} value={matchInfo.playerCount} onChange={e => handlePlayerCountChange(parseInt(e.target.value) || 11)} className="h-14 rounded-2xl border-2 font-bold text-lg" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-black flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> TEAM A IDENTITY</Label>
                  <Input placeholder="Home Team Name" value={matchInfo.teamAName} onChange={e => setMatchInfo({...matchInfo, teamAName: e.target.value})} className="font-black h-14 rounded-2xl border-2 text-xl px-6" />
                </div>
                <div className="grid grid-cols-6 gap-3">
                  {TEAM_COLORS.map(color => (
                    <button key={color.value} onClick={() => setMatchInfo({...matchInfo, teamAColor: color.value})} className={`w-full aspect-square rounded-2xl border-4 transition-all ${matchInfo.teamAColor === color.value ? 'scale-110 ring-4 ring-primary ring-offset-4 shadow-xl' : 'hover:scale-105 opacity-80 border-transparent'}`} style={{ backgroundColor: color.value }} title={color.name} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-4 p-6 bg-muted/20 rounded-3xl border-2 border-dashed">
                   {matchInfo.teamALogo ? (
                     <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-white shadow-xl">
                        <Image src={matchInfo.teamALogo} alt="Team A Logo" fill className="object-cover" />
                     </div>
                   ) : (
                     <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center">
                        <Palette className="w-8 h-8 text-muted-foreground" />
                     </div>
                   )}
                   <Button 
                     onClick={() => handleLogoGeneration('A')} 
                     disabled={generatingLogo === 'A' || !matchInfo.teamAName}
                     className="w-full h-12 rounded-xl font-black gap-2 shadow-lg"
                     variant="secondary"
                   >
                     {generatingLogo === 'A' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                     AI Generate Logo
                   </Button>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-black flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-secondary" /> TEAM B IDENTITY</Label>
                  <Input placeholder="Away Team Name" value={matchInfo.teamBName} onChange={e => setMatchInfo({...matchInfo, teamBName: e.target.value})} className="font-black h-14 rounded-2xl border-2 text-xl px-6" />
                </div>
                <div className="grid grid-cols-6 gap-3">
                  {TEAM_COLORS.map(color => (
                    <button key={color.value} onClick={() => setMatchInfo({...matchInfo, teamBColor: color.value})} className={`w-full aspect-square rounded-2xl border-4 transition-all ${matchInfo.teamBColor === color.value ? 'scale-110 ring-4 ring-primary ring-offset-4 shadow-xl' : 'hover:scale-105 opacity-80 border-transparent'}`} style={{ backgroundColor: color.value }} title={color.name} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-4 p-6 bg-muted/20 rounded-3xl border-2 border-dashed">
                   {matchInfo.teamBLogo ? (
                     <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-white shadow-xl">
                        <Image src={matchInfo.teamBLogo} alt="Team B Logo" fill className="object-cover" />
                     </div>
                   ) : (
                     <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center">
                        <Palette className="w-8 h-8 text-muted-foreground" />
                     </div>
                   )}
                   <Button 
                     onClick={() => handleLogoGeneration('B')} 
                     disabled={generatingLogo === 'B' || !matchInfo.teamBName}
                     className="w-full h-12 rounded-xl font-black gap-2 shadow-lg"
                     variant="secondary"
                   >
                     {generatingLogo === 'B' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                     AI Generate Logo
                   </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <Tabs defaultValue="teamA" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-2 h-16 rounded-[1.5rem]">
                <TabsTrigger value="teamA" className="font-black text-lg rounded-xl data-[state=active]:shadow-lg">{matchInfo.teamAName}</TabsTrigger>
                <TabsTrigger value="teamB" className="font-black text-lg rounded-xl data-[state=active]:shadow-lg">{matchInfo.teamBName}</TabsTrigger>
              </TabsList>
              <TabsContent value="teamA" className="space-y-6">
                <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl">
                  <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Team A Official Squad</span>
                  {pastTeams.length > 0 && (
                    <Select onValueChange={(val) => {
                      const selected = pastTeams.find(t => t.name === val);
                      if (selected) handleImport('A', selected.players);
                    }}>
                      <SelectTrigger className="w-[180px] h-10 rounded-xl font-bold border-2"><History className="w-4 h-4 mr-2" /><SelectValue placeholder="Import Recent" /></SelectTrigger>
                      <SelectContent className="rounded-xl">{pastTeams.map(t => <SelectItem key={t.name} value={t.name} className="font-bold">{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                <ScrollArea className="h-[400px] pr-6 rounded-2xl border-2 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchInfo.teamAPlayers.map((name, i) => (
                      <div key={i} className="flex items-center gap-4 bg-muted/20 p-2 rounded-xl border border-transparent hover:border-primary/20 transition-colors">
                        <span className="text-xs font-black w-8 text-center bg-primary text-white rounded-lg py-1">{i + 1}</span>
                        <Input value={name} onChange={(e) => handlePlayerNameChange('A', i, e.target.value)} className="h-11 border-2 rounded-xl font-bold bg-white" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="teamB" className="space-y-6">
                 <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl">
                  <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Team B Official Squad</span>
                  {pastTeams.length > 0 && (
                    <Select onValueChange={(val) => {
                      const selected = pastTeams.find(t => t.name === val);
                      if (selected) handleImport('B', selected.players);
                    }}>
                      <SelectTrigger className="w-[180px] h-10 rounded-xl font-bold border-2"><History className="w-4 h-4 mr-2" /><SelectValue placeholder="Import Recent" /></SelectTrigger>
                      <SelectContent className="rounded-xl">{pastTeams.map(t => <SelectItem key={t.name} value={t.name} className="font-bold">{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                <ScrollArea className="h-[400px] pr-6 rounded-2xl border-2 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchInfo.teamBPlayers.map((name, i) => (
                      <div key={i} className="flex items-center gap-4 bg-muted/20 p-2 rounded-xl border border-transparent hover:border-primary/20 transition-colors">
                        <span className="text-xs font-black w-8 text-center bg-primary text-white rounded-lg py-1">{i + 1}</span>
                        <Input value={name} onChange={(e) => handlePlayerNameChange('B', i, e.target.value)} className="h-11 border-2 rounded-xl font-bold bg-white" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          {step === 4 && (
            <div className="space-y-12 max-w-xl mx-auto">
              <div className="space-y-6">
                <Label className="text-xl font-black block text-center uppercase tracking-widest text-primary/60">Which team won the toss?</Label>
                <div className="grid grid-cols-2 gap-6">
                  <div onClick={() => setMatchInfo({...matchInfo, tossWinner: 'teamA'})} className={`p-8 border-4 rounded-3xl cursor-pointer text-center transition-all shadow-md hover:shadow-xl ${matchInfo.tossWinner === 'teamA' ? 'border-primary bg-primary text-white scale-105' : 'border-muted hover:border-primary/40'}`}>
                    <Trophy className={`w-8 h-8 mx-auto mb-3 ${matchInfo.tossWinner === 'teamA' ? 'text-white' : 'text-primary/20'}`} />
                    <span className="font-black text-lg uppercase tracking-tight">{matchInfo.teamAName}</span>
                  </div>
                  <div onClick={() => setMatchInfo({...matchInfo, tossWinner: 'teamB'})} className={`p-8 border-4 rounded-3xl cursor-pointer text-center transition-all shadow-md hover:shadow-xl ${matchInfo.tossWinner === 'teamB' ? 'border-primary bg-primary text-white scale-105' : 'border-muted hover:border-primary/40'}`}>
                    <Trophy className={`w-8 h-8 mx-auto mb-3 ${matchInfo.tossWinner === 'teamB' ? 'text-white' : 'text-primary/20'}`} />
                    <span className="font-black text-lg uppercase tracking-tight">{matchInfo.teamBName}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <Label className="text-xl font-black block text-center uppercase tracking-widest text-primary/60">Decision Made</Label>
                <div className="grid grid-cols-2 gap-6">
                  <div onClick={() => setMatchInfo({...matchInfo, tossChoice: 'bat'})} className={`p-8 border-4 rounded-3xl cursor-pointer text-center transition-all shadow-md hover:shadow-xl ${matchInfo.tossChoice === 'bat' ? 'border-secondary bg-secondary text-white scale-105' : 'border-muted hover:border-secondary/40'}`}>
                    <span className="font-black text-2xl uppercase tracking-tighter">BAT FIRST</span>
                  </div>
                  <div onClick={() => setMatchInfo({...matchInfo, tossChoice: 'bowl'})} className={`p-8 border-4 rounded-3xl cursor-pointer text-center transition-all shadow-md hover:shadow-xl ${matchInfo.tossChoice === 'bowl' ? 'border-secondary bg-secondary text-white scale-105' : 'border-muted hover:border-secondary/40'}`}>
                    <span className="font-black text-2xl uppercase tracking-tighter">BOWL FIRST</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-6">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack} className="flex-1 h-16 rounded-[1.5rem] font-black text-lg border-2 gap-2">
            <ChevronLeft className="w-6 h-6" /> Previous Step
          </Button>
        ) : (
          <Button variant="outline" onClick={() => router.push('/')} className="flex-1 h-16 rounded-[1.5rem] font-black text-lg border-2">
            Cancel
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={handleNext} className="flex-1 h-16 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 gap-2">
            Continue <ChevronRight className="w-6 h-6" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1 h-16 bg-secondary text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-transform">
            Go Live Now
          </Button>
        )}
      </div>
    </div>
  );
}
