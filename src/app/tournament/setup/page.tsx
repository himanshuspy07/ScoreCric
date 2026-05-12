
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Plus, Trash2, ChevronRight, ChevronLeft, Settings, Users, Activity, Palette } from 'lucide-react';
import { saveTournamentToLocalStorage } from '@/lib/storage';
import { generateTournamentFixtures } from '@/lib/match-utils';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Tournament, Team } from '@/types/cricket';

const TEAM_COLORS = [
  { name: 'Forest Green', value: '#2C5A37' },
  { name: 'Royal Blue', value: '#1E40AF' },
  { name: 'Amber Gold', value: '#B45309' },
  { name: 'Crimson Red', value: '#B91C1C' },
  { name: 'Midnight Purple', value: '#581C87' },
  { name: 'Sleek Black', value: '#18181B' },
];

export default function TournamentSetup() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [teams, setTeams] = useState<Team[]>([
    { name: '', color: '#2C5A37', players: [] },
    { name: '', color: '#1E40AF', players: [] },
    { name: '', color: '#B45309', players: [] },
    { name: '', color: '#B91C1C', players: [] },
  ]);
  const [settings, setSettings] = useState({
    overs: 20,
    playersPerTeam: 11,
    matchesPerTeam: 1
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Button onClick={() => router.push('/')} className="rounded-full font-black px-10 h-14 text-lg shadow-xl">Sign In to Continue</Button>
      </div>
    );
  }

  const addTeam = () => setTeams([...teams, { name: '', color: TEAM_COLORS[teams.length % TEAM_COLORS.length].value, players: [] }]);
  
  const updateTeamInfo = (i: number, field: keyof Team, val: any) => {
    const newTeams = [...teams];
    newTeams[i] = { ...newTeams[i], [field]: val };
    setTeams(newTeams);
  };

  const removeTeam = (i: number) => setTeams(teams.filter((_, idx) => idx !== i));

  const updatePlayerName = (teamIdx: number, playerIdx: number, val: string) => {
    const newTeams = [...teams];
    const newPlayers = [...newTeams[teamIdx].players];
    newPlayers[playerIdx] = val;
    newTeams[teamIdx].players = newPlayers;
    setTeams(newTeams);
  };

  const handleNext = () => {
    if (step === 1 && !name) {
      toast({ variant: "destructive", title: "Required", description: "Tournament name is mandatory." });
      return;
    }
    if (step === 2 && (teams.length < 2 || teams.some(t => !t.name))) {
      toast({ variant: "destructive", title: "Invalid Teams", description: "Need at least 2 teams with valid names." });
      return;
    }
    if (step === 3) {
      // Ensure all players have names or defaults
      const validatedTeams = teams.map(t => ({
        ...t,
        players: Array.from({ length: settings.playersPerTeam }, (_, i) => t.players[i] || `${t.name} Player ${i + 1}`)
      }));
      setTeams(validatedTeams);
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const teamNames = teams.map(t => t.name);
    const fixtures = generateTournamentFixtures(teamNames, settings.matchesPerTeam);

    const tournament: Tournament = {
      id,
      name,
      ownerId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      matchIds: [],
      teams: teams,
      settings: {
        overs: settings.overs,
        playersPerTeam: settings.playersPerTeam,
        matchesPerTeam: settings.matchesPerTeam
      },
      fixtures
    };

    saveTournamentToLocalStorage(tournament);
    toast({ title: "Tournament Created", description: `${fixtures.length} fixtures generated automatically!` });
    router.push(`/tournament/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-2xl shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-primary">League Creator</h1>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mt-1">Professional League Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {[1, 2, 3, 4].map((s) => (
             <div key={s} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
           ))}
        </div>
      </div>

      <Card className="border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/5 py-8 px-8 border-b">
          <div className="flex items-center gap-3">
             <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">{step}</span>
             <div>
                <CardTitle className="text-2xl font-black text-primary">
                  {step === 1 && "Identity & Rules"}
                  {step === 2 && "Team Identities & Branding"}
                  {step === 3 && "Professional Rosters"}
                  {step === 4 && "Tournament Format"}
                </CardTitle>
                <CardDescription className="text-xs font-bold opacity-60 uppercase tracking-widest">Configuration Phase</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-full">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Tournament Name</Label>
                <Input placeholder="e.g. Champions Trophy 2025" value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-2xl border-2 font-bold text-lg" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Activity className="w-4 h-4" /> Overs Per Inning</Label>
                <Input type="number" value={settings.overs} onChange={e => setSettings({...settings, overs: parseInt(e.target.value) || 20})} className="h-14 rounded-2xl border-2 font-bold text-lg" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Users className="w-4 h-4" /> Players Per Side</Label>
                <Input type="number" value={settings.playersPerTeam} onChange={e => setSettings({...settings, playersPerTeam: parseInt(e.target.value) || 11})} className="h-14 rounded-2xl border-2 font-bold text-lg" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Define Teams & Branding ({teams.length})</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team, i) => (
                  <Card key={i} className="p-4 border-2 rounded-2xl bg-muted/20 relative">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder={`Team ${i + 1} Name`} 
                          value={team.name} 
                          onChange={e => updateTeamInfo(i, 'name', e.target.value)}
                          className="h-12 border-2 rounded-xl font-bold bg-white"
                        />
                        {teams.length > 2 && (
                          <Button variant="ghost" size="icon" onClick={() => removeTeam(i)} className="text-destructive h-12 w-12 rounded-xl">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {TEAM_COLORS.map(color => (
                            <button
                              key={color.value}
                              onClick={() => updateTeamInfo(i, 'color', color.value)}
                              className={`w-8 h-8 rounded-full border-2 transition-transform ${team.color === color.value ? 'scale-125 border-primary shadow-md' : 'border-transparent opacity-60'}`}
                              style={{ backgroundColor: color.value }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button variant="outline" onClick={addTeam} className="w-full h-14 rounded-2xl border-dashed border-2 gap-2 font-bold text-lg">
                <Plus className="w-5 h-5" /> Add New Participant
              </Button>
            </div>
          )}

          {step === 3 && (
            <Tabs defaultValue={teams[0].name} className="w-full">
              <TabsList className="flex flex-wrap h-auto bg-muted p-2 rounded-[1.5rem] mb-8">
                {teams.map((team) => (
                  <TabsTrigger 
                    key={team.name} 
                    value={team.name} 
                    className="flex-1 font-black text-xs py-3 rounded-xl data-[state=active]:shadow-lg"
                  >
                    {team.name || 'Untitled Team'}
                  </TabsTrigger>
                ))}
              </TabsList>
              {teams.map((team, teamIdx) => (
                <TabsContent key={team.name} value={team.name} className="space-y-6">
                  <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{team.name} Official Roster</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{settings.playersPerTeam} Slots</span>
                  </div>
                  <ScrollArea className="h-[450px] pr-6 rounded-2xl border-2 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: settings.playersPerTeam }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 bg-muted/10 p-2 rounded-xl border border-transparent hover:border-primary/20 transition-colors">
                          <span className="text-[10px] font-black w-8 text-center bg-primary/20 text-primary rounded-lg py-1">{i + 1}</span>
                          <Input 
                            placeholder={`Enter Player Name`}
                            value={team.players[i] || ''} 
                            onChange={(e) => updatePlayerName(teamIdx, i, e.target.value)}
                            className="h-11 border-2 rounded-xl font-bold bg-white" 
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {step === 4 && (
            <div className="space-y-8 max-w-xl mx-auto text-center">
              <div className="space-y-4">
                <Label className="text-xl font-black block uppercase tracking-widest text-primary">Matches Per Pair</Label>
                <p className="text-sm text-muted-foreground font-medium mb-4">Select the number of times each team will play against one another in the group stage.</p>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(count => (
                    <button 
                      key={count} 
                      onClick={() => setSettings({...settings, matchesPerTeam: count})}
                      className={`p-6 border-4 rounded-3xl transition-all ${settings.matchesPerTeam === count ? 'border-primary bg-primary text-white scale-105 shadow-xl' : 'border-muted hover:border-primary/40'}`}
                    >
                      <span className="text-2xl font-black">{count}x</span>
                      <p className="text-[10px] font-black uppercase opacity-60">Round Robin</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted/30 p-8 rounded-[2.5rem] border-2 border-dashed space-y-3">
                 <Settings className="w-10 h-10 mx-auto text-primary/40 mb-2" />
                 <h4 className="font-black text-primary uppercase text-sm tracking-[0.2em]">Fixture Generation Summary</h4>
                 <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                   Based on your {teams.length} teams and the {settings.matchesPerTeam}x format, ScoreCric will automatically generate <strong>{generateTournamentFixtures(teams.map(t => t.name), settings.matchesPerTeam).length} fixtures</strong>. 
                   Player rosters and team colors are now finalized.
                 </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-6">
        <Button variant="outline" onClick={step > 1 ? () => setStep(step - 1) : () => router.push('/')} className="flex-1 h-16 rounded-[1.5rem] font-black text-lg border-2">
          {step > 1 ? "Previous" : "Cancel"}
        </Button>
        {step < 4 ? (
          <Button onClick={handleNext} className="flex-1 h-16 bg-primary text-white rounded-[1.5rem] font-black text-xl shadow-xl gap-2">
            Continue <ChevronRight className="w-6 h-6" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1 h-16 bg-secondary text-white rounded-[1.5rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-transform">
            Launch Tournament
          </Button>
        )}
      </div>
    </div>
  );
}
