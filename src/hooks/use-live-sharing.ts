
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Peer, DataConnection } from 'peerjs';
import { Match } from '@/types/cricket';
import { useToast } from './use-toast';

export function useLiveSharing(match: Match | null, isScorer: boolean = true) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const peerRef = useRef<Peer | null>(null);
  const { toast } = useToast();

  const stopSharing = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setPeerId(null);
    setStatus('disconnected');
    setConnections([]);
  }, []);

  const startSharing = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const { default: Peer } = await import('peerjs');

    const newPeer = new Peer(`scorecric-${Math.random().toString(36).substr(2, 9)}`);
    peerRef.current = newPeer;
    setStatus('connecting');

    newPeer.on('open', (id) => {
      setPeerId(id);
      setStatus('connected');
    });

    newPeer.on('connection', (conn) => {
      setConnections((prev) => [...prev, conn]);
      
      conn.on('open', () => {
        // Send initial full state
        if (match) {
          conn.send({ type: 'init', match });
        }
      });

      conn.on('close', () => {
        setConnections((prev) => prev.filter(c => c.peer !== conn.peer));
      });
    });

    newPeer.on('error', (err) => {
      toast({ variant: "destructive", title: "Sharing Error", description: err.message });
      setStatus('disconnected');
    });
  }, [match, toast]);

  // Broadcast updates whenever match changes
  useEffect(() => {
    if (isScorer && status === 'connected' && match && connections.length > 0) {
      connections.forEach(conn => {
        if (conn.open) {
          conn.send({ type: 'update', match });
        }
      });
    }
  }, [match, status, connections, isScorer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  return { peerId, status, startSharing, stopSharing };
}

export function useLiveViewer(targetPeerId: string | null) {
  const [match, setMatch] = useState<Match | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!targetPeerId || typeof window === 'undefined') return;

    const connect = async () => {
      const { default: Peer } = await import('peerjs');
      const peer = new Peer();
      peerRef.current = peer;
      setStatus('connecting');

      peer.on('open', () => {
        const conn = peer.connect(targetPeerId);
        connRef.current = conn;

        conn.on('open', () => {
          setStatus('connected');
        });

        conn.on('data', (data: any) => {
          if (data.type === 'init' || data.type === 'update') {
            setMatch(data.match);
          }
        });

        conn.on('close', () => {
          setStatus('disconnected');
          toast({ title: "Disconnected", description: "Scorer has ended the session." });
        });

        conn.on('error', (err) => {
          setStatus('disconnected');
          toast({ variant: "destructive", title: "Connection Error", description: err.message });
        });
      });

      peer.on('error', (err) => {
        setStatus('disconnected');
        toast({ variant: "destructive", title: "Peer Error", description: err.message });
      });
    };

    connect();

    return () => {
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [targetPeerId, toast]);

  return { match, status };
}
