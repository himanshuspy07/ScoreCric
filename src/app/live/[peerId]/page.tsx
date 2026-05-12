
"use client"

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Match, Inning } from '@/types/cricket';
import { getRunRate, getWinProbability, getComparativeManhattanData, getComparativeWormData } from '@/lib/match-utils';
import { ChevronLeft, Share2, BarChart3, LineChart, Zap, Activity, Radio, Info } from 'lucide-react';
import MatchScorecard from '@/components/scorecard/MatchScorecard';
import PartnershipView from '@/components/scorecard/PartnershipView';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as ReLineChart } from 'recharts';
import { useLiveViewer } from '@/hooks/use-live-sharing';

export default function LiveViewerPage({ params }: { params: Promise<{ peerId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('score');
  const { match, status } = useLiveViewer(resolvedParams.peerId);

  if (status === 'connecting' || !match) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3FAF4] p-6 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="space-y-1">
        <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Connecting to Scorer</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase opacity-40">Establishing WebRTC Tunnel...</p>
      </div>
    </div>
  );

  const currentInning = match.innings[match.currentInning - 1] as Inning;
  const winProb = getWinProbability(match);
  const battingTeamObj = currentInning.battingTeam === match.teamA.name ? match.teamA : match.teamB;
  const brandingColor = battingTeamObj.color || '#2C5A37';

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
            <div className="flex items-center justify-center gap-1.5 bg-black/10 px-3 py-0.5 rounded-full mb-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Broadcast</span>
            </div>
            <h2 className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">{match.title}</h2>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-white/10">
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
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
             <p className="text-[10px] font-black opacity-60 uppercase">Run Rate</p>
             <p className="text-xl font-black">{getRunRate(currentInning.score, currentInning.overs * 6 + currentInning.ballsInOver)}</p>
          </div>
        </div>

        {match.currentInning === 2 && winProb !== null && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span>{currentInning.battingTeam} {Math.round(winProb)}%</span>
              <span>{currentInning.bowlingTeam} {100 - Math.round(winProb)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${winProb}%` }} />
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 pt-6">
        <div className="mb-6 flex items-center gap-3 bg-primary/5 border-2 border-primary/10 p-4 rounded-3xl">
           <Radio className="w-5 h-5 text-primary animate-pulse" />
           <p className="text-xs font-bold text-primary uppercase">Receiving real-time updates from Scorer device</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white/50 border shadow-sm p-1 rounded-2xl h-12 overflow-x-auto overflow-y-hidden scrollbar-hide">
            <TabsTrigger value="score" className="rounded-xl font-bold text-[9px] uppercase">Score</TabsTrigger>
            <TabsTrigger value="card" className="rounded-xl font-bold text-[9px] uppercase">Card</TabsTrigger>
            <TabsTrigger value="partners" className="rounded-xl font-bold text-[9px] uppercase">Pairs</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl font-bold text-[9px] uppercase">Stats</TabsTrigger>
            <TabsTrigger value="info" className="rounded-xl font-bold text-[9px] uppercase">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="space-y-6">
            <div className="relative">
              <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-hide">
                {currentInning.balls.slice(-15).map((b) => (
                  <div key={b.id} className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border-4 shadow-lg animate-in zoom-in-50 ${b.isWicket ? 'bg-destructive text-white border-destructive' : 'bg-white text-primary border-primary/10'}`}>
                    {b.isWicket ? 'W' : (b.isWide ? 'Wd' : (b.isNoBall ? 'Nb' : b.runs))}
                  </div>
                ))}
              </div>
            </div>
            <Card className="text-center py-20 bg-white/50 border-2 border-dashed rounded-[2.5rem]">
               <Activity className="w-12 h-12 text-primary/20 mx-auto mb-4" />
               <h3 className="text-xl font-black text-primary">Watching Live</h3>
               <p className="text-sm font-bold text-muted-foreground opacity-60">Ball-by-ball data synced automatically</p>
            </Card>
          </TabsContent>

          <TabsContent value="card">
            <MatchScorecard match={match} />
          </TabsContent>

          <TabsContent value="partners">
            <PartnershipView inning={currentInning} />
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-sm font-black flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Manhattan</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 h-[250px]">
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
              <Card className="border-2 rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-sm font-black flex items-center gap-2"><LineChart className="w-4 h-4" /> Worm</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 h-[250px]">
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
            <Card className="border-2 rounded-2xl p-6">
               <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b">
                     <span className="text-xs font-bold text-muted-foreground uppercase">Live Peer Status</span>
                     <span className="text-sm font-black text-green-600">Syncing Stable</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                     <span className="text-xs font-bold text-muted-foreground uppercase">Format</span>
                     <span className="text-sm font-black">{match.format}</span>
                  </div>
               </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
