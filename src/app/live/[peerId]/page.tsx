
"use client"

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inning } from '@/types/cricket';
import { getRunRate, getRequiredRunRate, getWinProbability, getComparativeManhattanData, getComparativeWormData } from '@/lib/match-utils';
import { ChevronLeft, Share2, BarChart3, LineChart, Zap, Activity, Radio, Swords, Wifi } from 'lucide-react';
import MatchScorecard from '@/components/scorecard/MatchScorecard';
import PartnershipView from '@/components/scorecard/PartnershipView';
import MatchStory from '@/components/scorecard/MatchStory';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as ReLineChart } from 'recharts';
import { useLiveViewer } from '@/hooks/use-live-sharing';
import { AnimationWrapper } from '@/components/AnimationWrapper';
import { ScorePiP } from '@/components/scorecard/ScorePiP';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveViewerPage({ params }: { params: Promise<{ peerId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('score');
  const { match, status } = useLiveViewer(resolvedParams.peerId);

  if (status === 'connecting' || !match) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3FAF4] p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8"
      >
        <div className="relative">
          <div className="w-24 h-24 border-8 border-primary/10 border-t-primary rounded-full animate-spin mx-auto" />
          <Wifi className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Establishing Secure Tunnel</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Handshaking with Scorer Device...</p>
        </div>
      </motion.div>
    </div>
  );

  const currentInning = match.innings[match.currentInning - 1] as Inning;

  if (!currentInning) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3FAF4] p-6 text-center space-y-4">
      <Activity className="w-12 h-12 text-primary animate-bounce" />
      <div className="space-y-1">
        <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Syncing Game Data</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase opacity-40">Loading latest inning state...</p>
      </div>
    </div>
  );

  const winProb = getWinProbability(match);
  const battingTeamObj = currentInning.battingTeam === match.teamA.name ? match.teamA : match.teamB;
  const brandingColor = battingTeamObj.color || '#2C5A37';

  const totalBalls = (currentInning.overs * 6) + currentInning.ballsInOver;
  const matchTotalBalls = (match.currentInning > 2 ? 1 : match.oversLimit) * 6;
  const ballsRemaining = Math.max(0, matchTotalBalls - totalBalls);
  
  const targetScoreIdx = match.currentInning === 2 ? 0 : (match.currentInning === 4 ? 2 : -1);
  const targetScore = targetScoreIdx !== -1 ? (match.innings[targetScoreIdx]?.score || 0) + 1 : 0;
  const rrr = targetScore > 0 ? getRequiredRunRate(targetScore, currentInning.score, ballsRemaining) : null;

  return (
    <AnimationWrapper match={match}>
      <div className="min-h-screen bg-[#F3FAF4] pb-24">
        <header 
          className={`sticky top-0 z-40 text-primary-foreground p-4 sm:p-6 shadow-2xl transition-colors duration-500`}
          style={{ backgroundColor: match.isSuperOver ? '#000' : brandingColor }}
        >
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full" onClick={() => router.push('/')}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Stream</span>
              </div>
              <h2 className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em] flex items-center gap-2">
                {match.isSuperOver && <Swords className="w-3 h-3 text-amber-500" />}
                {match.isSuperOver ? "SUPER OVER" : match.title}
              </h2>
            </div>

            <div className="flex gap-2">
              <ScorePiP match={match} />
              <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full" onClick={() => {
                const shareText = `${match.teamA.name} vs ${match.teamB.name}\nScore: ${currentInning.score}/${currentInning.wickets}`;
                if (navigator.share) navigator.share({ title: 'Live Cricket', text: shareText, url: window.location.href });
              }}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <motion.div 
              key={currentInning.score}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-1"
            >
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{currentInning.battingTeam}</p>
              <h1 className="text-5xl sm:text-7xl font-black font-headline tracking-tighter flex items-baseline gap-1">
                {currentInning.score}<span className="text-white/30 text-3xl sm:text-5xl">/</span>{currentInning.wickets}
              </h1>
              <p className="text-sm sm:text-base font-black opacity-80">
                {currentInning.overs}.{currentInning.ballsInOver} <span className="opacity-40 font-bold ml-1">({match.oversLimit}.0)</span>
              </p>
            </motion.div>
            
            <div className="flex flex-col gap-2">
              <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-lg">
                 <p className="text-[10px] font-black opacity-60 uppercase tracking-tighter">Run Rate</p>
                 <p className="text-2xl font-black">{getRunRate(currentInning.score, totalBalls)}</p>
              </div>
              {rrr !== null && (
                 <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-amber-500/30 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-amber-500/30 shadow-lg"
                 >
                    <p className="text-[10px] font-black text-amber-200 uppercase tracking-tighter">Req Rate</p>
                    <p className="text-2xl font-black text-amber-100">{rrr}</p>
                 </motion.div>
              )}
            </div>
          </div>

          {targetScore > 0 && winProb !== null && !match.isSuperOver && (
            <div className="mt-8 space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-amber-400" /> {currentInning.battingTeam} {Math.round(winProb)}%</span>
                <span>{currentInning.bowlingTeam} {100 - Math.round(winProb)}%</span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden flex border border-white/5 p-0.5">
                <motion.div 
                  className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${winProb}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </header>

        <main className="max-w-4xl mx-auto w-full px-4 pt-8">
          <div className="mb-8 flex items-center justify-between bg-white border-2 border-primary/5 p-5 rounded-[2rem] shadow-sm">
             <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <Radio className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Connection Status</p>
                  <p className="text-xs font-bold text-muted-foreground">Stable P2P Data Stream</p>
                </div>
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-green-600 uppercase">Synced</span>
             </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-white border-2 shadow-sm p-1.5 rounded-[1.5rem] h-14">
              <TabsTrigger value="score" className="rounded-xl font-black text-[10px] uppercase tracking-tighter">Live</TabsTrigger>
              <TabsTrigger value="card" className="rounded-xl font-black text-[10px] uppercase tracking-tighter">Card</TabsTrigger>
              <TabsTrigger value="partners" className="rounded-xl font-black text-[10px] uppercase tracking-tighter">Pairs</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-xl font-black text-[10px] uppercase tracking-tighter">Stats</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-xl font-black text-[10px] uppercase tracking-tighter">Story</TabsTrigger>
            </TabsList>

            <TabsContent value="score" className="space-y-8">
              <div className="relative">
                <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 -mx-2 px-2 scrollbar-hide">
                  <AnimatePresence mode="popLayout">
                    {currentInning.balls.slice(-15).map((b) => (
                      <motion.div 
                        key={b.id} 
                        layout
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black border-4 shadow-xl ${
                          b.isWicket ? 'bg-destructive text-white border-destructive' : 
                          b.runs === 4 ? 'bg-blue-600 text-white border-blue-400' :
                          b.runs === 6 ? 'bg-green-600 text-white border-green-400' :
                          'bg-white text-primary border-primary/10'
                        }`}
                      >
                        {b.isWicket ? 'W' : (b.isWide ? 'Wd' : (b.isNoBall ? 'Nb' : b.runs))}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              
              <Card className="text-center py-20 bg-white border-2 border-dashed rounded-[3rem] shadow-inner relative overflow-hidden group">
                 <div className="absolute inset-0 bg-primary/[0.02] group-hover:bg-primary/[0.04] transition-colors" />
                 <div className="relative z-10">
                    <Activity className="w-16 h-16 text-primary/20 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-primary tracking-tighter">Watching Live Update</h3>
                    <p className="text-sm font-bold text-muted-foreground opacity-60 uppercase tracking-widest mt-2">Ball-by-ball precision synced</p>
                 </div>
              </Card>
            </TabsContent>

            <TabsContent value="card">
              <MatchScorecard match={match} />
            </TabsContent>

            <TabsContent value="partners">
              <PartnershipView inning={currentInning} />
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 rounded-[2rem] overflow-hidden shadow-sm">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Manhattan Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 h-[300px]">
                    <ChartContainer config={{ team1: { label: match.teamA.name, color: match.teamA.color }, team2: { label: match.teamB.name, color: match.teamB.color } }} className="h-full w-full">
                      <BarChart data={getComparativeManhattanData(match)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="team1" fill="var(--color-team1)" radius={[4, 4, 0, 0]} />
                        {match.currentInning >= 2 && <Bar dataKey="team2" fill="var(--color-team2)" radius={[4, 4, 0, 0]} />}
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card className="border-2 rounded-[2rem] overflow-hidden shadow-sm">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><LineChart className="w-4 h-4" /> Worm Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 h-[300px]">
                    <ChartContainer config={{ team1: { label: match.teamA.name, color: match.teamA.color }, team2: { label: match.teamB.name, color: match.teamB.color } }} className="h-full w-full">
                      <ReLineChart data={getComparativeWormData(match)}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="over" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="team1" stroke="var(--color-team1)" strokeWidth={4} dot={false} />
                        {match.currentInning >= 2 && <Line type="monotone" dataKey="team2" stroke="var(--color-team2)" strokeWidth={4} dot={false} />}
                      </ReLineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <MatchStory match={match} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AnimationWrapper>
  );
}

