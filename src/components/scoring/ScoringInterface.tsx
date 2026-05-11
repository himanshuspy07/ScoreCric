
"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Match, Inning, Ball, DismissalType } from '@/types/cricket';
import { Users, PlayCircle, Undo2, ChevronRight, Activity, Target } from 'lucide-react';

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

  useEffect(() => {
    if (currentInning.balls.length > 0) {
      const lastBall = currentInning.balls[currentInning.balls.length - 1];
      const overFinished = currentInning.ballsInOver === 0 && currentInning.overs > 0 && !lastBall.isWide && !lastBall.isNoBall;
      
      if (!strikerId) {
        if (lastBall.isWicket) {
          setNonStrikerId(lastBall.nonStrikerId);
        } else {
          const runsRotate = lastBall.runs % 2 !== 0;
          if (overFinished) {
             setStrikerId(runsRotate ? lastBall.batsmanId : lastBall.nonStrikerId);
             setNonStrikerId(runsRotate ? lastBall.nonStrikerId : lastBall.batsmanId);
          } else {
             setStrikerId(runsRotate ? lastBall.nonStrikerId : lastBall.batsmanId);
             setNonStrikerId(runsRotate ? lastBall.batsmanId : lastBall.nonStrikerId);
          }
        }
      }
      
      if (!bowlerId && !overFinished) {
        setBowlerId(lastBall.bowlerId);
      }
    }
  }, [currentInning.balls.length, currentInning.ballsInOver, currentInning.overs]);

  const addBall = (runs: number, options: Partial<Ball> = {}) => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      return;
    }

    const newInning = JSON.parse(JSON.stringify(currentInning)); // Deep clone
    let runsToAdd = runs;
    if (options.isWide || options.isNoBall) {
      runsToAdd += 1;
    }

    const ball: Ball = {
      id: Math.random().toString(36).substr(2, 9),
      bowlerId,
      batsmanId: strikerId,
      nonStrikerId: nonStrikerId,
      runs,
      isWide: options.isWide || false,
      isNoBall: options.isNoBall || false,
      isByes: options.isByes || false,
      isLegByes: options.isLegByes || false,
      isWicket: options.isWicket || false,
      wicketType: options.wicketType,
      cumulativeScore: newInning.score + runsToAdd,
      overNumber: newInning.overs,
      ballNumber: newInning.ballsInOver + 1
    };

    if (!newInning.batsmen[strikerId]) {
      newInning.batsmen[strikerId] = { id: strikerId, name: strikerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
    }
    if (!newInning.bowlers[bowlerId]) {
      newInning.bowlers[bowlerId] = { id: bowlerId, name: bowlerId, overs: 0, balls: 0, maidens: 0, runsConceded: 0, wickets: 0, dots: 0 };
    }

    const batsman = newInning.batsmen[strikerId];
    const bowler = newInning.bowlers[bowlerId];

    if (ball.isWide) {
      newInning.extras.wides += 1;
    } else if (ball.isNoBall) {
      newInning.extras.noBalls += 1;
    } else {
      newInning.ballsInOver += 1;
      if (newInning.ballsInOver === 6) {
        newInning.overs += 1;
        newInning.ballsInOver = 0;
        setStrikerId(nonStrikerId);
        setNonStrikerId(strikerId);
        setBowlerId('');
      }
    }

    newInning.score += runsToAdd;
    
    if (!ball.isWide && !ball.isByes && !ball.isLegByes) {
      batsman.runs += runs;
      if (runs === 4) batsman.fours += 1;
      if (runs === 6) batsman.sixes += 1;
    }
    if (!ball.isWide) {
      batsman.balls += 1;
    }

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
      setStrikerId('');
    } else {
      if (runs % 2 !== 0) {
        setStrikerId(nonStrikerId);
        setNonStrikerId(strikerId);
      }
    }

    newInning.balls.push(ball);
    onUpdate(newInning);
  };

  const undoLastBall = () => {
    if (currentInning.balls.length === 0) return;

    const balls = [...currentInning.balls];
    const undoneBall = balls.pop()!;
    
    setStrikerId(undoneBall.batsmanId);
    setNonStrikerId(undoneBall.nonStrikerId);
    setBowlerId(undoneBall.bowlerId);

    const newInning = { ...currentInning, balls };
    let totalScore = 0;
    let totalWickets = 0;
    let totalOvers = 0;
    let totalBallsInOver = 0;
    const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
    const batsmen: Record<string, any> = {};
    const bowlers: Record<string, any> = {};
    const fallOfWickets: any[] = [];

    balls.forEach(b => {
      let bRuns = b.runs;
      if (b.isWide || b.isNoBall) {
        bRuns += 1;
        if (b.isWide) extras.wides += 1;
        if (b.isNoBall) extras.noBalls += 1;
      } else {
        totalBallsInOver += 1;
        if (totalBallsInOver === 6) {
          totalOvers += 1;
          totalBallsInOver = 0;
        }
      }
      totalScore += bRuns;

      if (!batsmen[b.batsmanId]) batsmen[b.batsmanId] = { id: b.batsmanId, name: b.batsmanId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
      if (!bowlers[b.bowlerId]) bowlers[b.bowlerId] = { id: b.bowlerId, name: b.bowlerId, overs: 0, balls: 0, maidens: 0, runsConceded: 0, wickets: 0, dots: 0 };

      if (!b.isWide && !b.isByes && !b.isLegByes) {
        batsmen[b.batsmanId].runs += b.runs;
        if (b.runs === 4) batsmen[b.batsmanId].fours += 1;
        if (b.runs === 6) batsmen[b.batsmanId].sixes += 1;
      }
      if (!b.isWide) batsmen[b.batsmanId].balls += 1;

      if (!b.isByes && !b.isLegByes) bowlers[b.bowlerId].runsConceded += bRuns;
      if (!b.isWide && !b.isNoBall) {
        bowlers[b.bowlerId].balls += 1;
        if (bowlers[b.bowlerId].balls === 6) {
          bowlers[b.bowlerId].overs += 1;
          bowlers[b.bowlerId].balls = 0;
        }
      }

      if (b.isWicket) {
        totalWickets += 1;
        batsmen[b.batsmanId].isOut = true;
        batsmen[b.batsmanId].dismissalType = b.wicketType;
        if (b.wicketType !== 'run out') bowlers[b.bowlerId].wickets += 1;
        fallOfWickets.push({ wicket: totalWickets, score: totalScore, overs: `${totalOvers}.${totalBallsInOver}` });
      }
    });

    onUpdate({
      ...newInning,
      score: totalScore,
      wickets: totalWickets,
      overs: totalOvers,
      ballsInOver: totalBallsInOver,
      extras,
      batsmen,
      bowlers,
      fallOfWickets
    });
  };

  const handleWicket = () => {
    addBall(0, { isWicket: true, wicketType });
    setIsWicketOpen(false);
  };

  const isControlsDisabled = !strikerId || !nonStrikerId || !bowlerId;

  const target = match.innings[0] ? match.innings[0].score + 1 : 0;
  const runsNeeded = target - currentInning.score;
  const totalPossibleBalls = match.oversLimit * 6;
  const ballsBowled = currentInning.overs * 6 + currentInning.ballsInOver;
  const ballsRemaining = Math.max(0, totalPossibleBalls - ballsBowled);

  return (
    <div className="space-y-6">
      {match.currentInning === 2 && match.innings[0] && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
           <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="bg-amber-100 p-2 rounded-xl">
                    <Target className="w-5 h-5 text-amber-600" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">The Chase</p>
                    <p className="text-lg font-black text-amber-900 leading-tight">
                      {runsNeeded > 0 ? `Need ${runsNeeded} runs to win` : "Target achieved!"}
                    </p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Remaining</p>
                 <p className="text-lg font-black text-amber-900">{ballsRemaining} <span className="text-[10px] opacity-40">BALLS</span></p>
              </div>
           </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-white/60 backdrop-blur-md shadow-2xl rounded-[2rem] overflow-hidden">
        <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]"><Users className="w-4 h-4 text-primary" /> Active Striker</Label>
            <Select value={strikerId} onValueChange={setStrikerId}>
              <SelectTrigger className="font-black border-2 h-14 rounded-2xl text-lg bg-white/50">
                <SelectValue placeholder="Select Batter" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {battingTeamPlayers.players.map(p => (
                  <SelectItem key={p} value={p} disabled={currentInning.batsmen[p]?.isOut || p === nonStrikerId} className="font-bold text-lg">
                    {p} {currentInning.batsmen[p] ? `(${currentInning.batsmen[p].runs})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]"><Users className="w-4 h-4 text-primary" /> Non-Striker</Label>
            <Select value={nonStrikerId} onValueChange={setNonStrikerId}>
              <SelectTrigger className="font-black border-2 h-14 rounded-2xl text-lg bg-white/50">
                <SelectValue placeholder="Select Batter" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {battingTeamPlayers.players.map(p => (
                  <SelectItem key={p} value={p} disabled={currentInning.batsmen[p]?.isOut || p === strikerId} className="font-bold text-lg">
                    {p} {currentInning.batsmen[p] ? `(${currentInning.batsmen[p].runs})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-3">
            <Label className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]"><PlayCircle className="w-4 h-4 text-primary" /> Current Bowler</Label>
            <Select value={bowlerId} onValueChange={setBowlerId}>
              <SelectTrigger className="font-black border-2 h-14 rounded-2xl text-lg bg-white/50">
                <SelectValue placeholder="Assign Bowler" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {bowlingTeamPlayers.players.map(p => (
                  <SelectItem key={p} value={p} className="font-bold text-lg">
                    {p} {currentInning.bowlers[p] ? `(${currentInning.bowlers[p].wickets}-${currentInning.bowlers[p].runsConceded})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4, 6].map(run => (
          <Button 
            key={run} 
            disabled={isControlsDisabled}
            onClick={() => addBall(run)} 
            className={`h-16 sm:h-20 text-2xl sm:text-3xl font-black bg-white text-primary border-4 border-primary/5 hover:bg-primary/5 active:scale-95 shadow-xl rounded-3xl transition-all ${run === 4 ? 'text-blue-600 border-blue-100/50' : run === 6 ? 'text-green-600 border-green-100/50' : ''} ${isControlsDisabled ? 'opacity-30' : ''}`}
          >
            {run}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Button 
          disabled={isControlsDisabled}
          onClick={() => addBall(0, { isWide: true })} 
          className="h-16 sm:h-20 text-lg font-black bg-amber-50 text-amber-700 border-4 border-amber-200 shadow-lg rounded-3xl active:scale-95 disabled:opacity-30"
        >
          WIDE
        </Button>
        <Button 
          disabled={isControlsDisabled}
          onClick={() => addBall(0, { isNoBall: true })} 
          className="h-16 sm:h-20 text-lg font-black bg-blue-50 text-blue-700 border-4 border-blue-200 shadow-lg rounded-3xl active:scale-95 disabled:opacity-30"
        >
          NO BALL
        </Button>
        <Dialog open={isWicketOpen} onOpenChange={setIsWicketOpen}>
          <DialogTrigger asChild>
            <Button disabled={isControlsDisabled} variant="destructive" className="h-16 sm:h-20 text-lg font-black shadow-xl shadow-destructive/20 rounded-3xl active:scale-95 disabled:opacity-30">WICKET</Button>
          </DialogTrigger>
          <DialogContent className="w-[90%] rounded-[2rem] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-destructive">Dismissal Type</DialogTitle>
            </DialogHeader>
            <div className="py-8">
              <Select value={wicketType} onValueChange={v => setWicketType(v as DismissalType)}>
                <SelectTrigger className="h-14 border-2 font-black text-lg rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="bowled" className="font-bold">Bowled</SelectItem>
                  <SelectItem value="caught" className="font-bold">Caught</SelectItem>
                  <SelectItem value="lbw" className="font-bold">LBW</SelectItem>
                  <SelectItem value="run out" className="font-bold">Run Out</SelectItem>
                  <SelectItem value="stumped" className="font-bold">Stumped</SelectItem>
                  <SelectItem value="hit wicket" className="font-bold">Hit Wicket</SelectItem>
                  <SelectItem value="retired" className="font-bold">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-3 sm:gap-2">
              <Button onClick={() => setIsWicketOpen(false)} variant="outline" className="rounded-2xl font-bold h-14 flex-1 sm:flex-none">Cancel</Button>
              <Button onClick={handleWicket} variant="destructive" className="rounded-2xl font-black h-14 flex-1 sm:flex-none">Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button 
          variant="outline" 
          onClick={undoLastBall}
          className="h-16 sm:h-20 text-lg font-black gap-2 border-4 rounded-3xl active:scale-95 shadow-xl"
          disabled={currentInning.balls.length === 0}
        >
          <Undo2 className="w-6 h-6" /> UNDO
        </Button>
      </div>

      <div className="relative">
         <div className="flex items-center gap-3 overflow-x-auto pb-6 pt-2 -mx-2 px-2 scrollbar-hide">
          {currentInning.balls.slice(-15).map((b) => (
            <div 
              key={b.id} 
              className={`flex-shrink-0 w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-sm sm:text-lg font-black border-4 shadow-lg animate-in zoom-in-50 duration-300 ${
                b.isWicket ? 'bg-destructive text-white border-destructive shadow-destructive/20' : 
                b.runs === 4 ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' :
                b.runs === 6 ? 'bg-green-600 text-white border-green-600 shadow-green-200' :
                'bg-white text-primary border-primary/10'
              }`}
            >
              {b.isWicket ? 'W' : (b.isWide ? 'Wd' : (b.isNoBall ? 'Nb' : b.runs))}
            </div>
          ))}
          {currentInning.balls.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center py-12 border-4 border-dashed rounded-[2rem] text-muted-foreground/30">
              <Activity className="w-10 h-10 mb-2 opacity-20" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Ready for first ball</span>
            </div>
          )}
        </div>
        {currentInning.balls.length > 0 && <div className="absolute right-0 top-0 bottom-6 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />}
      </div>
    </div>
  );
}
