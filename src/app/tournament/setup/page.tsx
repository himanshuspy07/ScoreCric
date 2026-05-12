
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { saveTournamentToLocalStorage } from '@/lib/storage';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function TournamentSetup() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [teams, setTeams] = useState<string[]>(['', '']);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Button onClick={() => router.push('/')}>Sign In to Continue</Button>
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

  const handleSubmit = () => {
    if (!name || teams.some(t => !t)) {
      toast({ variant: "destructive", title: "Missing Info", description: "Fill all team names and tournament name." });
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const tournament = {
      id,
      name,
      ownerId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      matchIds: [],
      teams: teams
    };

    saveTournamentToLocalStorage(tournament);
    router.push(`/tournament/${id}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-primary p-3 rounded-2xl shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary">League Setup</h1>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mt-1">Official Tournament Configuration</p>
        </div>
      </div>

      <Card className="border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/5 py-8 px-8 border-b">
          <CardTitle className="text-2xl font-black">Tournament Details</CardTitle>
          <CardDescription className="text-xs font-bold opacity-60 uppercase tracking-widest">Define your competition</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Tournament Name</Label>
            <Input placeholder="e.g. Champions Trophy 2024" value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-2xl border-2 font-bold text-lg" />
          </div>

          <div className="space-y-4">
            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Participating Teams ({teams.length})</Label>
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
              <Plus className="w-4 h-4" /> Add Another Team
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-6">
        <Button variant="outline" onClick={() => router.push('/')} className="flex-1 h-16 rounded-[1.5rem] font-black text-lg border-2">Cancel</Button>
        <Button onClick={handleSubmit} className="flex-1 h-16 bg-primary text-white rounded-[1.5rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-transform">Initialize League</Button>
      </div>
    </div>
  );
}
