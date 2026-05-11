
"use client"

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMatchById, saveMatch } from '@/lib/storage';
import { Match, Inning } from '@/types/cricket';
import { getRunRate, getManhattanData, getWormData } from '@/lib/match-utils';
import { ChevronLeft, Share2, BarChart3, LineChart, Info, Trophy } from 'lucide-react';
import ScoringInterface from '@/components/scoring/ScoringInterface';
import MatchScorecard from '@/components/scorecard/MatchScorecard';
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
        await navigator.share({
          title: 'ScoreCric Match Update',
          text: shareText,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            toast({ title: "Copied", description: "Match details copied to clipboard." });
          } catch (clipboardError) {
            toast({ variant: "destructive", title: "Share failed", description: "Could not share or copy link." });
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast({ title: "Copied", description: "Match details copied to clipboard." });
      } catch (e) {
        toast({ variant: "destructive", title: "Copy failed", description: "Could not copy link." });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F3FAF4] pb-24">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground p-3 sm:p-5 shadow-lg shadow-primary/10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" className="hover:bg-white/10 active:scale-90" onClick={() => router.push('/')}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h2 className="text-xs sm:text-sm font-bold opacity-80 uppercase tracking-widest">{match.title || "Match"}</h2>
            <p className="text-[10px] sm:text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full mt-1">{match.format} • {match.oversLimit} Overs</p>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-white/10 active:scale-90" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black font-headline tracking-tighter">
              {currentInning.score}<span className="text-white/40">/</span>{currentInning.wickets}
            </h1>
            <p className="text-xs sm:text-sm font-bold opacity-75 mt-1">
              Overs: {currentInning.overs}.{currentInning.ballsInOver} <span className="text-white/30 text-[10px]">({match.oversLimit})</span>
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="bg-secondary px-3 py-1 rounded-lg shadow-sm">
               <p className="text-xs sm:text-sm font-black text-white">
                CRR: {getRunRate(currentInning.score, currentInning.overs * 6 + currentInning.ballsInOver)}
              </p>
            </div>
            {match.currentInning === 2 && match.innings[0] && (
              <p className="text-[10px] sm:text-xs font-black bg-white/10 px-2 py-0.5 rounded">
                TARGET: {match.innings[0].score + 1}
              </p>
            )}
          </div>
        </div>
      </header>

      {match.status === 'completed' && (
        <div className="bg-secondary/90 backdrop-blur-md p-3 text-center text-white font-black text-xs sm:text-sm tracking-tighter shadow-inner">
          MATCH COMPLETED: {match.winner === 'Tie' ? "MATCH TIED" : `${match.winner.toUpperCase()} WON`}
        </div>
      )}

      <main className="max-w-4xl mx-auto w-full px-2 sm:px-6 pt-4 sm:pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/50 backdrop-blur shadow-sm p-1 rounded-xl h-12">
            <TabsTrigger value="score" className="rounded-lg font-bold text-xs uppercase tracking-tighter">Scoring</TabsTrigger>
            <TabsTrigger value="card" className="rounded-lg font-bold text-xs uppercase tracking-tighter">Card</TabsTrigger>
            <TabsTrigger value="info" className="rounded-lg font-bold text-xs uppercase tracking-tighter">Info</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg font-bold text-xs uppercase tracking-tighter">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="animate-in fade-in zoom-in-95 duration-300">
            {match.status !== 'completed' ? (
              <ScoringInterface 
                match={match} 
                onUpdate={handleScoreUpdate}
              />
            ) : (
              <Card className="text-center py-16 sm:py-24 space-y-6 bg-white/50 border-2">
                <div className="bg-primary/10 p-5 rounded-full w-fit mx-auto">
                   <Trophy className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-black text-primary">Match Ended</p>
                  <p className="text-sm text-muted-foreground font-medium">This match has been completed.</p>
                </div>
                <Button onClick={() => setActiveTab('card')} className="px-8 font-bold shadow-lg">View Full Scorecard</Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="card" className="animate-in slide-in-from-bottom-4 duration-300">
            <MatchScorecard match={match} />
          </TabsContent>

          <TabsContent value="info" className="animate-in slide-in-from-bottom-4 duration-300">
            <Card className="border-2 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 py-4">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-primary">
                  <Info className="w-4 h-4" /> MATCH INFORMATION
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 px-4 sm:px-6">
                <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground/80">Toss</span>
                  <span className="text-xs sm:text-sm font-black text-foreground">{match.tossWinner} won & elected to {match.tossChoice}</span>
                </div>
                <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground/80">Date</span>
                  <span className="text-xs sm:text-sm font-black text-foreground">{new Date(match.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground/80">Status</span>
                  <span className="capitalize text-xs sm:text-sm font-black text-primary bg-primary/10 px-3 py-0.5 rounded-full">{match.status}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs sm:text-sm font-bold text-muted-foreground/80">Match ID</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{match.id}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="flex flex-col border-2 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 bg-primary/5">
                  <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-primary">
                    <BarChart3 className="w-4 h-4" /> Manhattan Chart
                  </CardTitle>
                  <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Runs scored per over</p>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px] pt-6">
                  {currentInning.balls.length > 0 ? (
                    <ChartContainer config={{ runs: { label: "Runs", color: "hsl(var(--primary))" } }} className="h-full w-full">
                      <BarChart data={getManhattanData(currentInning)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="runs" fill="var(--color-runs)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs sm:text-sm py-20 gap-3">
                      <div className="bg-muted p-4 rounded-full">
                         <BarChart3 className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-bold opacity-60">No data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col border-2 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 bg-secondary/5">
                  <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-secondary">
                    <LineChart className="w-4 h-4" /> Worm Chart
                  </CardTitle>
                  <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Cumulative runs progression</p>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px] pt-6">
                  {currentInning.balls.length > 0 ? (
                    <ChartContainer config={{ score: { label: "Score", color: "hsl(var(--secondary))" } }} className="h-full w-full">
                      <ReLineChart data={getWormData(currentInning)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={3} dot={false} />
                      </ReLineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs sm:text-sm py-20 gap-3">
                      <div className="bg-muted p-4 rounded-full">
                         <LineChart className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-bold opacity-60">No data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="pwa-footer bg-white/90 backdrop-blur-md border-t border-primary/10">
        <div className="flex items-center justify-center gap-1.5 font-bold tracking-tight text-primary/60">
          <span className="bg-primary text-white text-[8px] px-1 py-0.5 rounded">SC</span>
          <span>SCORECRIC</span>
        </div>
      </footer>
    </div>
  );
}
