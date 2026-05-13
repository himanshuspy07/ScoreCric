
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star } from 'lucide-react';

interface MilestoneEffectProps {
  type: 'FIFTY' | 'HUNDRED';
  playerName?: string;
  runs?: number;
  onComplete: () => void;
}

export function MilestoneEffect({ type, playerName, runs, onComplete }: MilestoneEffectProps) {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 4000);
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 12 }}
          className="bg-gradient-to-br from-amber-400 to-amber-600 p-12 rounded-[4rem] text-white shadow-[0_0_50px_rgba(245,158,11,0.5)] border-8 border-white/20 text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Trophy className="w-24 h-24 mx-auto mb-6 text-white drop-shadow-lg" />
          </motion.div>
          
          <h2 className="text-7xl font-black tracking-tighter uppercase italic leading-none">
            {type === 'HUNDRED' ? 'Century!' : 'Fifty!'}
          </h2>
          
          <div className="mt-4 space-y-2">
            <p className="text-3xl font-black uppercase tracking-widest">{playerName}</p>
            <div className="flex items-center justify-center gap-2">
              <Star className="w-6 h-6 fill-white" />
              <span className="text-4xl font-black">{runs} Runs</span>
              <Star className="w-6 h-6 fill-white" />
            </div>
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.3em] mt-8 opacity-60">
            Professional Milestone Reached
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
