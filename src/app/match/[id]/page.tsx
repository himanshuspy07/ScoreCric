
"use client"

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getMatchById, saveMatch } from '@/lib/storage';
import { Match, Inning, Ball } from '@/types/cricket';
import { getRunRate, getRequiredRunRate, getManhattanData, getWormData, getWinProbability, getComparativeManhattanData, getComparativeWormData } from '@/lib/match-utils';
import { ChevronLeft, Share2, BarChart3, LineChart, Info, Trophy, Zap, Activity, Target } from 'lucide-react';
import ScoringInterface from '@/components/scoring/ScoringInterface';
import MatchScorecard from '@/components/scorecard/MatchScorecard';
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as ReLineChart } from 'recharts';

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [match, setMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState('score');

  useEffect(() => {
    const loaded = getMatchById(resolvedParams.id);
    if (loaded) {
      setMatch(loaded);
    } else {
      router.push('/');
    }
  }, [resolvedParams.id, router]);

  if (!match) return null;

  const currentInning = match.innings[match.currentInning - 1] as Inning;
  const winProb = getWinProbability(match);

  // Dynamic branding color
  const battingTeamObj = currentInning.battingTeam === match.teamA.name ? match.teamA : match.teamB;
  const bowlingTeamObj = currentInning.battingTeam === match.teamA.name ? match.teamB : match.teamA;
  const brandingColor = battingTeamObj.color || '#2C5A37';
  const bowlBrandingColor = bowlingTeamObj.color || '#1E40AF';

  const handleScoreUpdate = (updatedInning: Inning) => {
    const updatedMatch: Match = {
      ...match,
      innings: match.currentInning === 1 
        ? [updatedInning, match.innings[1]] 
        : [match.innings[0], updatedInning],
      updatedAt: Date.now()
    };
    
    const oversFinished = updatedInning.overs >= match.oversLimit;
    const allOut = updatedInning.wickets >= 10;
    const targetAchieved = match.currentInning === 2 && updatedInning.score > (match.innings[0]?.score || 0);

    if (oversFinished || allOut || targetAchieved) {
      if (match.currentInning === 1) {
        if (!match.innings[1]) {
          const nextInning: Inning = {
            battingTeam: updatedInning.bowlingTeam,
            bowlingTeam: updatedInning.battingTeam,
            score: 0,
            wickets: 0,
            overs: 0,
            ballsInOver: 0,
            extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
            balls: [],
            batsmen: {},
            bowlers: {},
            fallOfWickets: []
          };
          updatedMatch.currentInning = 2;
          updatedMatch.innings[1] = nextInning;
          toast({ title: "Inning Finished", description: "First inning completed. Start second inning scoring." });
        }
      } else {
        updatedMatch.status = 'completed';
        const score1 = match.innings[0]!.score;
        const score2 = updatedInning.score;
        if (score2 > score1) {
          updatedMatch.winner = updatedInning.battingTeam;
        } else if (score1 > score2) {
          updatedMatch.winner = updatedInning.bowlingTeam;
        } else {
          updatedMatch.winner = 'Tie';
        }
        toast({ title: "Match Completed", description: updatedMatch.winner === 'Tie' ? "Match Tied!" : `${updatedMatch.winner} Won!` });
      }
    }

    setMatch(updatedMatch);
    saveMatch(updatedMatch);
  };

  const handleShare = async () => {
    const shareText = `${match.teamA.name} vs ${match.teamB.name}\nScore: ${currentInning.score}/${currentInning.wickets} in ${currentInning.overs}.${currentInning.ballsInOver} overs`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ScoreCric Match Update', text: shareText, url: shareUrl });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          toast({ title: "Copied", description: "Match details copied to clipboard." });
        }
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({ title: "Copied", description: "Match details copied to clipboard." });
    }
  };

  const renderTimeline = () => {
    const allEvents: { ball: Ball; inningIdx: number; team: string }[] = [];
    match.innings.forEach((inn, idx) => {
      if (!inn) return;
      inn.balls.forEach(b => {
        if (b.isWicket || b.runs >= 4) {
          allEvents.push({ ball: b, inningIdx: idx + 1, team: inn.battingTeam });
        }
      });
    });

    // Show most recent events first
    allEvents.reverse();

    if (allEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/50 rounded-2xl border-2 border-dashed">
          <Activity className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold text-sm">No major events yet</p>
          <p className="text-[10px] uppercase tracking-widest mt-1">Boundaries and wickets appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 px-2">
        {allEvents.map((ev, i) => (
          <div key={ev.ball.id} className="relative flex gap-4">
            {/* Timeline track */}
            {i !== allEvents.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-muted-foreground/10" />
            )}
            
            {/* Event Marker */}
            <div className={`z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-4 border-[#F3FAF4] shadow-md ${
              ev.ball.isWicket ? 'bg-destructive text-white' : 
              ev.ball.runs === 4 ? 'bg-blue-600 text-white' : 
              'bg-green-600 text-white'
            }`}>
              {ev.ball.isWicket ? 'W' : ev.ball.runs}
            </div>

            {/* Event Content */}
            <Card className="flex-1 shadow-sm border-2 overflow-hidden hover:border-primary/20 transition-colors">
              <div className="p-3 flex justify-between items-center">
                <div className="space-y-0.5">
                   <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-tighter bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Inning {ev.inningIdx}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">Over {ev.ball.overNumber}.{ev.ball.ballNumber}</span>
                   </div>
                   <p className="text-sm font-black leading-tight">
                     {ev.ball.isWicket 
                       ? `${ev.ball.batsmanId} dismissed by ${ev.ball.bowlerId}`
                       : `${ev.ball.batsmanId} hits a ${ev.ball.runs}!`
                     }
                   </p>
                   <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">{ev.team}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black text-primary">{ev.ball.cumulativeScore}/{ev.ball.isWicket ? '?' : ''}</p>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">Score</p>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3FAF4] pb-24">
      <header 
        className="sticky top-0 z-40 text-primary-foreground p-3 sm:p-5 shadow-lg transition-colors duration-500"
        style={{ backgroundColor: brandingColor }}
      >
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => router.push('/')}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h2 className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">{match.title}</h2>
            <p className="text-xs font-bold bg-black/10 px-3 py-0.5 rounded-full mt-1 uppercase tracking-tighter">{match.format} • {match.oversLimit} OVERS</p>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{currentInning.battingTeam}</p>
            <h1 className="text-4xl sm:text-6xl font-black font-headline tracking-tighter flex items-baseline gap-1">
              {currentInning.score}<span className="text-white/30 text-2xl sm:text-4xl">/</span>{currentInning.wickets}
            </h1>
            <p className="text-xs sm:text-sm font-black opacity-80">
              {currentInning.overs}.{currentInning.ballsInOver} <span className="opacity-40 font-bold ml-1">({match.oversLimit}.0)</span>
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
               <p className="text-[10px] font-black opacity-60 uppercase">Run Rate</p>
               <p className="text-sm sm:text-base font-black">{getRunRate(currentInning.score, currentInning.overs * 6 + currentInning.ballsInOver)}</p>
            </div>
            {match.currentInning === 2 && match.innings[0] && (
              <div className="bg-amber-500/90 shadow-lg px-3 py-1.5 rounded-xl">
                <p className="text-[10px] font-black text-amber-900/60 uppercase">Req Rate</p>
                <p className="text-sm sm:text-base font-black text-white">
                  {getRequiredRunRate(match.innings[0].score + 1, currentInning.score, (match.oversLimit * 6) - (currentInning.overs * 6 + currentInning.ballsInOver))}
                </p>
              </div>
            )}
          </div>
        </div>

        {match.currentInning === 2 && winProb !== null && (
          <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> {currentInning.battingTeam} {Math.round(winProb)}%</span>
              <span>{currentInning.bowlingTeam} {100 - Math.round(winProb)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${winProb}%` }} />
            </div>
          </div>
        )}
      </header>

      {match.status === 'completed' && (
        <div className="bg-secondary p-3 text-center text-white font-black text-xs sm:text-sm tracking-tighter uppercase">
          {match.winner === 'Tie' ? "MATCH TIED" : `${match.winner} WON`}
        </div>
      )}

      <main className="max-w-4xl mx-auto w-full px-4 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white/50 border shadow-sm p-1 rounded-2xl h-12 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsTrigger value="score" className="rounded-xl font-bold text-[9px] uppercase">Score</TabsTrigger>
            <TabsTrigger value="card" className="rounded-xl font-bold text-[9px] uppercase">Card</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl font-bold text-[9px] uppercase">Story</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl font-bold text-[9px] uppercase">Stats</TabsTrigger>
            <TabsTrigger value="info" className="rounded-xl font-bold text-[9px] uppercase">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="score">
            {match.status !== 'completed' ? (
              <ScoringInterface match={match} onUpdate={handleScoreUpdate} />
            ) : (
              <Card className="text-center py-20 bg-white/50 border-2 border-dashed">
                <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto mb-6">
                   <Trophy className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-primary mb-2">Victory!</h3>
                <p className="text-muted-foreground font-medium mb-8">This professional match has concluded.</p>
                <Button onClick={() => setActiveTab('card')} className="font-bold rounded-xl h-12 px-8">Final Scorecard</Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="card">
            <MatchScorecard match={match} />
          </TabsContent>

          <TabsContent value="timeline">
            {renderTimeline()}
          </TabsContent>

          <TabsContent value="info">
            <Card className="border-2 shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/50 py-4">
                <CardTitle className="text-xs font-black flex items-center gap-2 uppercase tracking-widest">Match Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-muted">
                  <span className="text-xs font-bold text-muted-foreground">Toss Status</span>
                  <span className="text-xs font-black">{match.tossWinner} elected to {match.tossChoice}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-muted">
                  <span className="text-xs font-bold text-muted-foreground">Match Date</span>
                  <span className="text-xs font-black">{new Date(match.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground">Team Branding</span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: match.teamA.color }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: match.teamB.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-sm font-black flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Manhattan</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Runs per over comparison</p>
                </CardHeader>
                <CardContent className="pt-6 h-[300px]">
                  {match.innings[0]?.balls.length ? (
                    <ChartContainer 
                      config={{ 
                        team1: { label: match.innings[0].battingTeam, color: match.innings[0].battingTeam === match.teamA.name ? match.teamA.color : match.teamB.color },
                        team2: { label: match.innings[1]?.battingTeam || "TBD", color: match.innings[1]?.battingTeam === match.teamA.name ? match.teamA.color : match.teamB.color }
                      }} 
                      className="h-full w-full"
                    >
                      <BarChart data={getComparativeManhattanData(match)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="team1" fill="var(--color-team1)" radius={2} />
                        {match.currentInning === 2 && <Bar dataKey="team2" fill="var(--color-team2)" radius={2} />}
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-bold">No data captured</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-sm font-black flex items-center gap-2"><LineChart className="w-4 h-4" /> Worm</CardTitle>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Cumulative run progression</p>
                </CardHeader>
                <CardContent className="pt-6 h-[300px]">
                  {match.innings[0]?.balls.length ? (
                    <ChartContainer 
                      config={{ 
                        team1: { label: match.innings[0].battingTeam, color: match.innings[0].battingTeam === match.teamA.name ? match.teamA.color : match.teamB.color },
                        team2: { label: match.innings[1]?.battingTeam || "TBD", color: match.innings[1]?.battingTeam === match.teamA.name ? match.teamA.color : match.teamB.color }
                      }} 
                      className="h-full w-full"
                    >
                      <ReLineChart data={getComparativeWormData(match)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="team1" stroke="var(--color-team1)" strokeWidth={3} dot={false} />
                        {match.currentInning === 2 && <Line type="monotone" dataKey="team2" stroke="var(--color-team2)" strokeWidth={3} dot={false} />}
                      </ReLineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-bold">No data captured</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="pwa-footer bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 font-black tracking-tight text-primary/40 uppercase text-[8px]">
          <span className="bg-primary text-white px-1 py-0.5 rounded">PRO</span>
          <span>SCORECRIC SYSTEM</span>
        </div>
      </footer>
    </div>
  );
}
