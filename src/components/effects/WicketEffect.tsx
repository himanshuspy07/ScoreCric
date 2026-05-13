
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface WicketEffectProps {
  playerName?: string;
  onComplete: () => void;
}

export function WicketEffect({ playerName, onComplete }: WicketEffectProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2500);
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-destructive/20 backdrop-blur-[2px]"
      >
        <div className="relative w-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="bg-destructive text-white py-12 flex flex-col items-center justify-center shadow-2xl border-y-8 border-white/20"
          >
            <motion.div
              animate={{ x: [-2, 2, -2, 2, 0] }}
              transition={{ repeat: Infinity, duration: 0.1 }}
            >
              <AlertCircle className="w-16 h-16 mb-4" />
            </motion.div>
            <h2 className="text-7xl font-black tracking-tighter uppercase italic">Wicket!</h2>
            {playerName && (
              <p className="text-2xl font-bold uppercase tracking-[0.2em] mt-2 opacity-80">
                {playerName} is Out
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
