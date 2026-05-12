
"use client"

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { saveMatchToLocalStorage, useLocalMatch } from '@/lib/storage';
import { Match, Inning, Ball } from '@/types/cricket';
import { getRunRate, getRequiredRunRate, getWinProbability, getComparativeManhattanData, getComparativeWormData, calculatePlayerOfTheMatch } from '@/lib/match-utils';
import { ChevronLeft, Share2, BarChart3, LineChart, Trophy, Zap, Activity, Target, Download, Users } from 'lucide-react';
import ScoringInterface from '@/components/scoring/ScoringInterface';
import MatchScorecard from '@/components/scorecard/MatchScorecard';
import PartnershipView from '@/components/scorecard/PartnershipView';
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as ReLineChart } from 'recharts';
import { useUser } from '@/firebase';
import { MatchSummaryCard } from '@/components/share/MatchSummaryCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('score');
  const [showTieDialog, setShowTieDialog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const { data: match, loading } = useLocalMatch(resolvedParams.id);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3FAF4]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!match) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-black text-primary mb-4">Match Not Found</h1>
      <Button onClick={() => router.push('/')}>Go Back Home</Button>
    </div>
  );

  const currentInning = match.innings[match.currentInning - 1] as Inning;
  const winProb = getWinProbability(match);

  const battingTeamObj = currentInning.battingTeam === match.teamA.name ? match.teamA : match.teamB;
  const brandingColor = battingTeamObj.color || '#2C5A37';

  const handleScoreUpdate = (updatedInning: Inning) => {
    if (user && user.uid !== match.ownerId) return;

    const updatedMatch: Match = {
      ...match,
      innings: match.currentInning === 1 
        ? [updatedInning, match.innings[1]] 
        : [match.innings[0], updatedInning],
      updatedAt: Date.now()
    };
    
    const currentBattingTeam = updatedInning.battingTeam === match.teamA.name ? match.teamA : match.teamB;
    const maxWickets = currentBattingTeam.players.length - 1;
    
    const oversFinished = updatedInning.overs >= match.oversLimit;
    const allOut = updatedInning.wickets >= maxWickets;
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
          
          const reason = allOut ? "Team All Out!" : (oversFinished ? "Overs Completed!" : "Inning Finished!");
          toast({ title: reason, description: "First inning completed. Start second inning scoring." });
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
          setShowTieDialog(true);
        }
        
        updatedMatch.manOfTheMatch = calculatePlayerOfTheMatch(updatedMatch);
        const endReason = allOut ? "All Out!" : (oversFinished ? "Overs Finished!" : "Target Reached!");
        toast({ title: "Match Completed", description: updatedMatch.winner === 'Tie' ? "Match Tied!" : `${endReason} ${updatedMatch.winner} Won!` });
        setShowSummary(true);
      }
    }

    saveMatchToLocalStorage(updatedMatch);
  };

  const handleShare = async () => {
    const shareText = `${match.teamA.name} vs ${match.teamB.name}\nScore: ${currentInning.score}/${currentInning.wickets} in ${currentInning.overs}.${currentInning.ballsInOver} overs`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ScoreCric Update', text: shareText, url: shareUrl });
      } catch (error: any) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast({ title: "Copied", description: "Match link copied to clipboard." });
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({ title: "Copied", description: "Match link copied to clipboard." });
    }
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
            <h2 className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">{match.isSuperOver ? "⚔️ SUPER OVER" : match.title}</h2>
            <p className="text-xs font-bold bg-black/10 px-3 py-0.5 rounded-full mt-1 uppercase tracking-tighter">{match.format} • {match.oversLimit} OVERS</p>
          </div>
          <div className="flex gap-2">
            {match.status === 'completed' && (
              <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => setShowSummary(true)}>
                <Download className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
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
            <div className="flex gap-2">
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                 <p className="text-[10px] font-black opacity-60 uppercase">Run Rate</p>
                 <p className="text-sm sm:text-base font-black">{getRunRate(currentInning.score, currentInning.overs * 6 + currentInning.ballsInOver)}</p>
              </div>
              {match.currentInning === 2 && match.innings[0] && (
                <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 flex flex-col items-center">
                   <p className="text-[10px] font-black opacity-60 uppercase">Target</p>
                   <p className="text-sm sm:text-base font-black">{match.innings[0].score + 1}</p>
                </div>
              )}
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

        {match.currentInning === 2 && winProb !== null && !match.isSuperOver && (
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

      <main className="max-w-4xl mx-auto w-full px-4 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-white/50 border shadow-sm p-1 rounded-2xl h-12 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsTrigger value="score" className="rounded-xl font-bold text-[9px] uppercase">Score</TabsTrigger>
            <TabsTrigger value="card" className="rounded-xl font-bold text-[9px] uppercase">Card</TabsTrigger>
            <TabsTrigger value="partners" className="rounded-xl font-bold text-[9px] uppercase">Pairs</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl font-bold text-[9px] uppercase">Stats</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl font-bold text-[9px] uppercase">Story</TabsTrigger>
            <TabsTrigger value="info" className="rounded-xl font-bold text-[9px] uppercase">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="score">
            {match.status !== 'completed' ? (
              (!user || user?.uid === match.ownerId) ? (
                <ScoringInterface match={match} onUpdate={handleScoreUpdate} />
              ) : (
                <Card className="text-center py-20 bg-white/50 border-2 border-dashed">
                  <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto mb-6">
                     <Activity className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-black text-primary mb-2">Spectating Mode</h3>
                  <p className="text-muted-foreground font-medium mb-4">You are viewing this match locally.</p>
                </Card>
              )
            ) : (
              <Card className="text-center py-20 bg-white/50 border-2 border-dashed">
                <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto mb-6">
                   <Trophy className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-primary mb-2">Victory!</h3>
                <Button onClick={() => setShowSummary(true)} className="font-bold rounded-xl h-12 px-8">Share Result Recap</Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="card">
            <MatchScorecard match={match} />
          </TabsContent>

          <TabsContent value="partners">
            <div className="space-y-6">
              <PartnershipView inning={match.innings[0]!} />
              {match.innings[1] && <PartnershipView inning={match.innings[1]} />}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-sm font-black flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Manhattan</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 h-[300px]">
                  <ChartContainer config={{ team1: { label: match.teamA.name, color: match.teamA.color }, team2: { label: match.teamB.name, color: match.teamB.color } }} className="h-full w-full">
                    <BarChart data={getComparativeManhattanData(match)}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="over" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="team1" fill="var(--color-team1)" radius={2} />
                      {match.currentInning === 2 && <Bar dataKey="team2" fill="var(--color-team2)" radius={2} />}
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-sm font-black flex items-center gap-2"><LineChart className="w-4 h-4" /> Worm</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 h-[300px]">
                  <ChartContainer config={{ team1: { label: match.teamA.name, color: match.teamA.color }, team2: { label: match.teamB.name, color: match.teamB.color } }} className="h-full w-full">
                    <ReLineChart data={getComparativeWormData(match)}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="over" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="team1" stroke="var(--color-team1)" strokeWidth={3} dot={false} />
                      {match.currentInning === 2 && <Line type="monotone" dataKey="team2" stroke="var(--color-team2)" strokeWidth={3} dot={false} />}
                    </ReLineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="info">
            <Card className="border-2 shadow-sm rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                   <span className="text-xs font-bold text-muted-foreground uppercase">Toss Winner</span>
                   <span className="text-sm font-black">{match.tossWinner}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                   <span className="text-xs font-bold text-muted-foreground uppercase">Decision</span>
                   <span className="text-sm font-black">{match.tossChoice === 'bat' ? 'Batting' : 'Bowling'} First</span>
                </div>
                {match.tournamentId && (
                  <Button variant="outline" className="w-full font-black text-xs uppercase" onClick={() => router.push(`/tournament/${match.tournamentId}`)}>View Tournament Standings</Button>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-xl w-[95%] rounded-[2.5rem] max-h-[90dvh] overflow-y-auto">
          <MatchSummaryCard match={match} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showTieDialog} onOpenChange={setShowTieDialog}>
        <AlertDialogContent className="w-[90%] rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-center">It&apos;s a Tie!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">Scores are level. Settle with a <strong>Super Over</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold h-12 flex-1">Finish as Tie</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/match/setup')} className="bg-primary text-white rounded-2xl font-black h-12 flex-1">Start Super Over</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
