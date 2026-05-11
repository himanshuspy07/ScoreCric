
"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Match, Inning, Ball, PlayerStats, BowlerStats, DismissalType } from '@/types/cricket';
import { Users, AlertCircle, PlayCircle } from 'lucide-react';

interface ScoringInterfaceProps {
  match: Match;
  onUpdate: (inning: Inning) => void;
}

export default function ScoringInterface({ match, onUpdate }: ScoringInterfaceProps) {
  const currentInning = match.innings[match.currentInning - 1] as Inning;
  const battingTeamPlayers = match.currentInning === 1 
    ? (match.tossWinner === match.teamA.name ? (match.tossChoice === 'bat' ? match.teamA : match.teamB) : (match.tossChoice === 'bat' ? match.teamB : match.teamA))
    : (match.tossWinner === match.teamA.name ? (match.tossChoice === 'bat' ? match.teamB : match.teamA) : (match.tossChoice === 'bat' ? match.teamA : match.teamB));

  const bowlingTeamPlayers = battingTeamPlayers.name === match.teamA.name ? match.teamB : match.teamA;

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');

  const [isWicketOpen, setIsWicketOpen] = useState(false);
  const [wicketType, setWicketType] = useState<DismissalType>('bowled');

  const addBall = (runs: number, options: Partial<Ball> = {}) => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      alert("Please select striker, non-striker and bowler first.");
      return;
    }

    const newInning = { ...currentInning };
    const ball: Ball = {
      id: Math.random().toString(36).substr(2, 9),
      bowlerId,
      batsmanId: strikerId,
      runs,
      isWide: options.isWide || false,
      isNoBall: options.isNoBall || false,
      isByes: options.isByes || false,
      isLegByes: options.isLegByes || false,
      isWicket: options.isWicket || false,
      wicketType: options.wicketType,
    };

    // Initialize player stats if not exists
    if (!newInning.batsmen[strikerId]) {
      newInning.batsmen[strikerId] = { id: strikerId, name: strikerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
    }
    if (!newInning.bowlers[bowlerId]) {
      newInning.bowlers[bowlerId] = { id: bowlerId, name: bowlerId, overs: 0, balls: 0, maidens: 0, runsConceded: 0, wickets: 0, dots: 0 };
    }

    const batsman = newInning.batsmen[strikerId];
    const bowler = newInning.bowlers[bowlerId];

    // Score calculations
    let runsToAdd = runs;
    if (ball.isWide || ball.isNoBall) {
      runsToAdd += 1;
      newInning.extras[ball.isWide ? 'wides' : 'noBalls'] += 1;
    } else {
      newInning.ballsInOver += 1;
      if (newInning.ballsInOver === 6) {
        newInning.overs += 1;
        newInning.ballsInOver = 0;
        // Auto swap striker on over change
        setStrikerId(nonStrikerId);
        setNonStrikerId(strikerId);
        setBowlerId(''); // Force select new bowler
      }
    }

    newInning.score += runsToAdd;
    
    // Update Batsman
    if (!ball.isWide && !ball.isByes && !ball.isLegByes) {
      batsman.runs += runs;
      if (runs === 4) batsman.fours += 1;
      if (runs === 6) batsman.sixes += 1;
    }
    if (!ball.isWide) {
      batsman.balls += 1;
    }

    // Update Bowler
    if (!ball.isByes && !ball.isLegByes) {
      bowler.runsConceded += runsToAdd;
    }
    if (!ball.isWide && !ball.isNoBall) {
      bowler.balls += 1;
      if (bowler.balls === 6) {
        bowler.overs += 1;
        bowler.balls = 0;
      }
      if (runs === 0 && !ball.isWicket) bowler.dots += 1;
    }
    if (ball.isWicket && ball.wicketType !== 'run out') {
      bowler.wickets += 1;
    }

    // Handle Wicket
    if (ball.isWicket) {
      newInning.wickets += 1;
      batsman.isOut = true;
      batsman.dismissalType = ball.wicketType;
      batsman.bowlerName = bowler.name;
      newInning.fallOfWickets.push({
        wicket: newInning.wickets,
        score: newInning.score,
        overs: `${newInning.overs}.${newInning.ballsInOver}`
      });
      setStrikerId(''); // New batsman needed
    } else {
      // Rotate strike
      if (runs % 2 !== 0) {
        setStrikerId(nonStrikerId);
        setNonStrikerId(strikerId);
      }
    }

    newInning.balls.push(ball);
    onUpdate(newInning);
  };

  const handleWicket = () => {
    addBall(0, { isWicket: true, wicketType });
    setIsWicketOpen(false);
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Users className="w-4 h-4" /> Striker</Label>
            <Select value={strikerId} onValueChange={setStrikerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Striker" />
              </SelectTrigger>
              <SelectContent>
                {battingTeamPlayers.players.map(p => (
                  <SelectItem key={p} value={p} disabled={currentInning.batsmen[p]?.isOut || p === nonStrikerId}>
                    {p} {currentInning.batsmen[p] ? `(${currentInning.batsmen[p].runs})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Users className="w-4 h-4" /> Non-Striker</Label>
            <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Non-Striker" />
              </SelectTrigger>
              <SelectContent>
                {battingTeamPlayers.players.map(p => (
                  <SelectItem key={p} value={p} disabled={currentInning.batsmen[p]?.isOut || p === strikerId}>
                    {p} {currentInning.batsmen[p] ? `(${currentInning.batsmen[p].runs})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="flex items-center gap-1"><PlayCircle className="w-4 h-4" /> Current Bowler</Label>
            <Select value={bowlerId} onValueChange={setBowlerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Bowler" />
              </SelectTrigger>
              <SelectContent>
                {bowlingTeamPlayers.players.map(p => (
                  <SelectItem key={p} value={p}>
                    {p} {currentInning.bowlers[p] ? `(${currentInning.bowlers[p].wickets}-${currentInning.bowlers[p].runsConceded})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 6].map(run => (
          <Button 
            key={run} 
            onClick={() => addBall(run)} 
            className="h-14 text-xl font-bold bg-white text-primary border-2 border-primary/20 hover:bg-primary/10"
          >
            {run}
          </Button>
        ))}
        <Button 
          onClick={() => addBall(0, { isWide: true })} 
          className="h-14 text-lg font-bold bg-amber-50 text-amber-700 border-2 border-amber-200"
        >
          WD
        </Button>
        <Button 
          onClick={() => addBall(0, { isNoBall: true })} 
          className="h-14 text-lg font-bold bg-blue-50 text-blue-700 border-2 border-blue-200"
        >
          NB
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Dialog open={isWicketOpen} onOpenChange={setIsWicketOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="h-14 text-lg font-bold">WICKET</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How did the wicket fall?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Select value={wicketType} onValueChange={v => setWicketType(v as DismissalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bowled">Bowled</SelectItem>
                  <SelectItem value="caught">Caught</SelectItem>
                  <SelectItem value="lbw">LBW</SelectItem>
                  <SelectItem value="run out">Run Out</SelectItem>
                  <SelectItem value="stumped">Stumped</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleWicket} variant="destructive">Confirm Wicket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button 
          variant="outline" 
          onClick={() => alert("Undo feature coming soon...")}
          className="h-14 text-lg font-bold"
        >
          UNDO
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto py-2">
        {currentInning.balls.slice(-12).map((b, i) => (
          <div 
            key={i} 
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
              b.isWicket ? 'bg-red-500 text-white border-red-600' : 
              b.runs === 4 ? 'bg-blue-500 text-white border-blue-600' :
              b.runs === 6 ? 'bg-green-500 text-white border-green-600' :
              'bg-muted border-muted-foreground/20'
            }`}
          >
            {b.isWicket ? 'W' : (b.isWide ? 'Wd' : (b.isNoBall ? 'Nb' : b.runs))}
          </div>
        ))}
      </div>
    </div>
  );
}
