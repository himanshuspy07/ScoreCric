
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Plus, Trash2, ChevronRight, ChevronLeft, Settings, Users, Activity } from 'lucide-react';
import { saveTournamentToLocalStorage } from '@/lib/storage';
import { generateTournamentFixtures } from '@/lib/match-utils';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Tournament } from '@/types/cricket';

export default function TournamentSetup() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [teams, setTeams] = useState<string[]>(['', '', '', '']);
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

  const addTeam = () => setTeams([...teams, '']);
  const updateTeam = (i: number, val: string) => {
    const newTeams = [...teams];
    newTeams[i] = val;
    setTeams(newTeams);
  };
  const removeTeam = (i: number) => setTeams(teams.filter((_, idx) => idx !== i));

  const handleNext = () => {
    if (step === 1 && !name) {
      toast({ variant: "destructive", title: "Required", description: "Tournament name is mandatory." });
      return;
    }
    if (step === 2 && (teams.length < 2 || teams.some(t => !t))) {
      toast({ variant: "destructive", title: "Invalid Teams", description: "Need at least 2 teams with valid names." });
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const fixtures = generateTournamentFixtures(teams, settings.matchesPerTeam);

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
           {[1, 2, 3].map((s) => (
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
                  {step === 2 && "League Participants"}
                  {step === 3 && "Fixture Intelligence"}
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
                <Input placeholder="e.g. World Cup 2024" value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-2xl border-2 font-bold text-lg" />
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
            <div className="space-y-6">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Enter Team Names ({teams.length})</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team, i) => (
                  <div key={i} className="flex gap-2">
                    <Input 
                      placeholder={`Team ${i + 1}`} 
                      value={team} 
                      onChange={e => updateTeam(i, e.target.value)}
                      className="h-12 border-2 rounded-xl font-bold"
                    />
                    {teams.length > 2 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTeam(i)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addTeam} className="w-full h-12 rounded-xl border-dashed border-2 gap-2 font-bold">
                <Plus className="w-4 h-4" /> Add Team
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 max-w-xl mx-auto text-center">
              <div className="space-y-4">
                <Label className="text-xl font-black block uppercase tracking-widest text-primary">Matches Per Team</Label>
                <p className="text-sm text-muted-foreground font-medium mb-4">How many times should each team play against every other team?</p>
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
              
              <div className="bg-muted/30 p-6 rounded-[2rem] border-2 border-dashed space-y-2">
                 <Settings className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                 <h4 className="font-black text-primary uppercase text-sm tracking-widest">Automatic Generation Ready</h4>
                 <p className="text-xs font-medium text-muted-foreground">This will generate {generateTournamentFixtures(teams, settings.matchesPerTeam).length} fixtures based on your {teams.length} teams.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-6">
        <Button variant="outline" onClick={step > 1 ? () => setStep(step - 1) : () => router.push('/')} className="flex-1 h-16 rounded-[1.5rem] font-black text-lg border-2">
          {step > 1 ? "Previous" : "Cancel"}
        </Button>
        {step < 3 ? (
          <Button onClick={handleNext} className="flex-1 h-16 bg-primary text-white rounded-[1.5rem] font-black text-xl shadow-xl gap-2">
            Continue <ChevronRight className="w-6 h-6" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1 h-16 bg-secondary text-white rounded-[1.5rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-transform">
            Generate League & Fixtures
          </Button>
        )}
      </div>
    </div>
  );
}
