
"use client"

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Match, Inning } from '@/types/cricket';
import { calculateStrikeRate, calculateEconomy } from '@/lib/match-utils';

export default function MatchScorecard({ match }: { match: Match }) {
  const renderInning = (inning: Inning, index: number) => {
    if (!inning) return null;

    return (
      <div key={index} className="space-y-6">
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-primary/5 py-3">
            <CardTitle className="text-lg flex justify-between">
              <span>{inning.battingTeam} Batting</span>
              <span>{inning.score}/{inning.wickets} ({inning.overs}.{inning.ballsInOver})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">Batter</TableHead>
                  <TableHead className="text-right">R</TableHead>
                  <TableHead className="text-right">B</TableHead>
                  <TableHead className="text-right">4s</TableHead>
                  <TableHead className="text-right">6s</TableHead>
                  <TableHead className="text-right">SR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(inning.batsmen).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <div>{b.name}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {b.isOut ? `${b.dismissalType} ${b.bowlerName ? `b ${b.bowlerName}` : ''}` : 'not out'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{b.runs}</TableCell>
                    <TableCell className="text-right">{b.balls}</TableCell>
                    <TableCell className="text-right">{b.fours}</TableCell>
                    <TableCell className="text-right">{b.sixes}</TableCell>
                    <TableCell className="text-right text-xs">{calculateStrikeRate(b.runs, b.balls)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 bg-muted/20 text-sm flex justify-between">
              <span className="font-semibold">Extras</span>
              <span>{Object.values(inning.extras).reduce((a, b) => a + b, 0)} (wd {inning.extras.wides}, nb {inning.extras.noBalls}, b {inning.extras.byes}, lb {inning.extras.legByes})</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-primary/5 py-3">
            <CardTitle className="text-lg">{inning.bowlingTeam} Bowling</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">Bowler</TableHead>
                  <TableHead className="text-right">O</TableHead>
                  <TableHead className="text-right">M</TableHead>
                  <TableHead className="text-right">R</TableHead>
                  <TableHead className="text-right">W</TableHead>
                  <TableHead className="text-right">Eco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(inning.bowlers).map((bw) => (
                  <TableRow key={bw.id}>
                    <TableCell className="font-medium">{bw.name}</TableCell>
                    <TableCell className="text-right">{bw.overs}.{bw.balls}</TableCell>
                    <TableCell className="text-right">{bw.maidens}</TableCell>
                    <TableCell className="text-right">{bw.runsConceded}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{bw.wickets}</TableCell>
                    <TableCell className="text-right text-xs">{calculateEconomy(bw.runsConceded, bw.overs * 6 + bw.balls)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {match.innings.map((inn, i) => inn && renderInning(inn, i))}
    </div>
  );
}
