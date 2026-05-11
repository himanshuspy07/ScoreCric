
'use client';

import { useMemo, useRef } from 'react';

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<T>(null as any);
  const depsRef = useRef<any[]>([]);

  const changed = deps.some((dep, i) => dep !== depsRef.current[i]);

  if (changed || ref.current === null) {
    ref.current = factory();
    depsRef.current = deps;
  }

  return ref.current;
}
