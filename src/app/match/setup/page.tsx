
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Layout, UserCog } from 'lucide-react';
import { saveMatch } from '@/lib/storage';
import { Match, Inning } from '@/types/cricket';

export default function MatchSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [matchInfo, setMatchInfo] = useState({
    title: '',
    format: 'T20',
    overs: '20',
    teamAName: 'Team A',
    teamBName: 'Team B',
    teamAPlayers: Array.from({length: 11}, (_, i) => `A Player ${i+1}`),
    teamBPlayers: Array.from({length: 11}, (_, i) => `B Player ${i+1}`),
    tossWinner: 'teamA',
    tossChoice: 'bat',
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

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
      teamA: { name: matchInfo.teamAName, players: matchInfo.teamAPlayers },
      teamB: { name: matchInfo.teamBName, players: matchInfo.teamBPlayers },
      tossWinner: matchInfo.tossWinner === 'teamA' ? matchInfo.teamAName : matchInfo.teamBName,
      tossChoice: matchInfo.tossChoice as any,
      status: 'live',
      currentInning: 1,
      innings: [createInning(battingTeam, bowlingTeam), null],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    saveMatch(newMatch);
    router.push(`/match/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 pt-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline tracking-tight">New Match Setup</h1>
      </div>

      <Card className="border-2">
        <CardHeader className="bg-primary/5">
          <CardTitle>
            {step === 1 && "Match Details"}
            {step === 2 && "Team Information"}
            {step === 3 && "Squad Setup"}
            {step === 4 && "Toss Details"}
          </CardTitle>
          <CardDescription>Step {step} of 4</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Match Title (Optional)</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Friendly Match" 
                  value={matchInfo.title} 
                  onChange={e => setMatchInfo({...matchInfo, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={matchInfo.format} onValueChange={v => setMatchInfo({...matchInfo, format: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T20">T20</SelectItem>
                      <SelectItem value="ODI">ODI</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Overs Limit</Label>
                  <Input 
                    type="number" 
                    value={matchInfo.overs} 
                    onChange={e => setMatchInfo({...matchInfo, overs: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Team A Name</Label>
                <Input 
                  value={matchInfo.teamAName} 
                  onChange={e => setMatchInfo({...matchInfo, teamAName: e.target.value})}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Team B Name</Label>
                <Input 
                  value={matchInfo.teamBName} 
                  onChange={e => setMatchInfo({...matchInfo, teamBName: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <Tabs defaultValue="teamA" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="teamA">{matchInfo.teamAName}</TabsTrigger>
                <TabsTrigger value="teamB">{matchInfo.teamBName}</TabsTrigger>
              </TabsList>
              <TabsContent value="teamA">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {matchInfo.teamAPlayers.map((name, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                        <Input 
                          value={name} 
                          onChange={(e) => handlePlayerNameChange('A', i, e.target.value)}
                          placeholder={`Player ${i + 1} Name`}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="teamB">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {matchInfo.teamBPlayers.map((name, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                        <Input 
                          value={name} 
                          onChange={(e) => handlePlayerNameChange('B', i, e.target.value)}
                          placeholder={`Player ${i + 1} Name`}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Who won the toss?</Label>
                <RadioGroup value={matchInfo.tossWinner} onValueChange={v => setMatchInfo({...matchInfo, tossWinner: v})}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="teamA" id="toss-a" />
                    <Label htmlFor="toss-a" className="flex-1 cursor-pointer">{matchInfo.teamAName}</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="teamB" id="toss-b" />
                    <Label htmlFor="toss-b" className="flex-1 cursor-pointer">{matchInfo.teamBName}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold">Toss winner elected to?</Label>
                <RadioGroup value={matchInfo.tossChoice} onValueChange={v => setMatchInfo({...matchInfo, tossChoice: v})}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="bat" id="choice-bat" />
                    <Label htmlFor="choice-bat" className="flex-1 cursor-pointer">Bat</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="bowl" id="choice-bowl" />
                    <Label htmlFor="choice-bowl" className="flex-1 cursor-pointer">Bowl</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack} className="flex-1 py-6">Back</Button>
        ) : (
          <Button variant="outline" onClick={() => router.push('/')} className="flex-1 py-6">Cancel</Button>
        )}
        {step < 4 ? (
          <Button onClick={handleNext} className="flex-1 py-6">Next</Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1 py-6 bg-secondary hover:bg-secondary/90">Start Match</Button>
        )}
      </div>

      <footer className="pwa-footer">
        Made by Himanshu Yadav
      </footer>
    </div>
  );
}
