
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RunScoredEffectProps {
  type: 'FOUR' | 'SIX';
  playerName?: string;
  onComplete: () => void;
}

export function RunScoredEffect({ type, playerName, onComplete }: RunScoredEffectProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2000);
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ 
            scale: [0, 1.5, 1], 
            rotate: [20, -5, 0],
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`px-12 py-6 rounded-[3rem] shadow-2xl border-8 ${
            type === 'SIX' 
              ? 'bg-green-600 border-green-400 text-white' 
              : 'bg-blue-600 border-blue-400 text-white'
          }`}
        >
          <div className="text-center">
            <motion.h2 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-8xl font-black italic tracking-tighter"
            >
              {type === 'SIX' ? 'SIX!' : 'FOUR!'}
            </motion.h2>
            {playerName && (
              <p className="text-xl font-black uppercase tracking-widest opacity-80 mt-2">
                {playerName}
              </p>
            )}
          </div>
        </motion.div>

        {/* Decorative particles or background pulse */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.2, 0], scale: [0.5, 2, 2.5] }}
          transition={{ duration: 1 }}
          className={`absolute w-[500px] h-[500px] rounded-full blur-3xl ${
            type === 'SIX' ? 'bg-green-500' : 'bg-blue-500'
          }`}
        />
      </motion.div>
    </AnimatePresence>
  );
}
