
"use client"

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMatchById, saveMatch } from '@/lib/storage';
import { Match, Inning } from '@/types/cricket';
import { getRunRate, getManhattanData, getWormData } from '@/lib/match-utils';
import { ChevronLeft, Share2, BarChart3, LineChart } from 'lucide-react';
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
    
    // Check if inning is over
    const oversFinished = updatedInning.overs >= match.oversLimit;
    const allOut = updatedInning.wickets >= 10;
    const targetAchieved = match.currentInning === 2 && updatedInning.score > (match.innings[0]?.score || 0);

    if (oversFinished || allOut || targetAchieved) {
      if (match.currentInning === 1) {
        // Prepare 2nd Inning if it doesn't exist
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
        // Match Completed
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h2 className="text-sm font-medium opacity-80">{match.title}</h2>
            <p className="text-xs">{match.format} • {match.oversLimit} Overs</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">
              {currentInning.score}/{currentInning.wickets}
            </h1>
            <p className="text-sm opacity-90">
              Overs: {currentInning.overs}.{currentInning.ballsInOver} ({match.oversLimit})
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-secondary">
              CRR: {getRunRate(currentInning.score, currentInning.overs * 6 + currentInning.ballsInOver)}
            </p>
            {match.currentInning === 2 && match.innings[0] && (
              <p className="text-xs opacity-90">
                Target: {match.innings[0].score + 1}
              </p>
            )}
          </div>
        </div>
      </header>

      {match.status === 'completed' && (
        <div className="bg-secondary p-2 text-center text-white font-bold text-sm">
          MATCH COMPLETED: {match.winner === 'Tie' ? "Match Tied" : `${match.winner} WON`}
        </div>
      )}

      <main className="max-w-5xl mx-auto p-2 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="score">Scoring</TabsTrigger>
            <TabsTrigger value="card">Scorecard</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="score">
            {match.status !== 'completed' ? (
              <ScoringInterface 
                match={match} 
                onUpdate={handleScoreUpdate}
              />
            ) : (
              <div className="text-center py-10 space-y-4">
                <p className="text-muted-foreground">This match has ended.</p>
                <Button onClick={() => setActiveTab('card')}>View Full Scorecard</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="card">
            <MatchScorecard match={match} />
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Toss</span>
                  <span className="font-medium">{match.tossWinner} won & elected to {match.tossChoice}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(match.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize font-medium">{match.status}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Manhattan Chart
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Runs scored per over</p>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px] sm:min-h-[350px]">
                  {currentInning.balls.length > 0 ? (
                    <ChartContainer config={{ runs: { label: "Runs", color: "hsl(var(--primary))" } }} className="h-full w-full">
                      <BarChart data={getManhattanData(currentInning)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="runs" fill="var(--color-runs)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-20">
                      No data available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-secondary" /> Worm Chart
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Cumulative runs progression</p>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px] sm:min-h-[350px]">
                  {currentInning.balls.length > 0 ? (
                    <ChartContainer config={{ score: { label: "Score", color: "hsl(var(--secondary))" } }} className="h-full w-full">
                      <ReLineChart data={getWormData(currentInning)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={false} />
                      </ReLineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-20">
                      No data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="pwa-footer">
        Made by Himanshu Yadav
      </footer>
    </div>
  );
}
