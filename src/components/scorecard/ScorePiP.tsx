
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PictureInPicture2 } from 'lucide-react';
import { Match, Inning } from '@/types/cricket';
import { useToast } from '@/hooks/use-toast';

interface ScorePiPProps {
  match: Match | null;
}

/**
 * ScorePiP Component
 * Uses the Picture-in-Picture API to create a floating score widget.
 * It renders the score to a canvas, captures a stream, and plays it in a hidden video element.
 */
export function ScorePiP({ match }: ScorePiPProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const { toast } = useToast();

  const updateCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !match) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentInning = match.innings[match.currentInning - 1];
    if (!currentInning) return;

    // Background
    ctx.fillStyle = '#2C5A37'; // ScoreCric Primary Green
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Grid Pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    // Title / Match Name
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(match.title.toUpperCase(), canvas.width / 2, 15);

    // Score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'black 60px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${currentInning.score}/${currentInning.wickets}`, canvas.width / 2, canvas.height / 2);

    // Batting Team
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(currentInning.battingTeam, canvas.width / 2, canvas.height / 2 + 45);

    // Overs
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${currentInning.overs}.${currentInning.ballsInOver} Overs`, canvas.width / 2, canvas.height / 2 + 70);

    // Winner Status
    if (match.status === 'completed') {
      ctx.fillStyle = '#f59e0b'; // Amber
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(match.winner === 'Tie' ? 'MATCH TIED' : `${match.winner} WON`, canvas.width / 2, 40);
    }
  };

  useEffect(() => {
    if (isPipActive) {
      updateCanvas();
    }
  }, [match, isPipActive]);

  const togglePiP = async () => {
    try {
      if (typeof document === 'undefined') return;

      if (!document.pictureInPictureEnabled) {
        toast({ 
          title: "Not Supported", 
          description: "Your browser doesn't support Picture-in-Picture." 
        });
        return;
      }

      if (isPipActive) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        }
        setIsPipActive(false);
        return;
      }

      // Initialize canvas
      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 200;
        canvasRef.current = canvas;
      }

      // Initialize video with stream
      if (!videoRef.current) {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        // @ts-ignore
        video.srcObject = canvasRef.current.captureStream(10); // 10 FPS is enough for score
        videoRef.current = video;
      }

      updateCanvas();
      await videoRef.current.play();
      await videoRef.current.requestPictureInPicture();
      setIsPipActive(true);

      const onLeave = () => setIsPipActive(false);
      videoRef.current.addEventListener('leavepictureinpicture', onLeave, { once: true });

    } catch (error) {
      console.error('PiP Error:', error);
      toast({ 
        variant: "destructive", 
        title: "Pin Failed", 
        description: "Could not activate floating scoreboard." 
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={`hover:bg-white/10 ${isPipActive ? 'text-amber-400' : ''}`}
      onClick={togglePiP}
      title="Pin Scoreboard"
    >
      <PictureInPicture2 className="w-5 h-5" />
    </Button>
  );
}
