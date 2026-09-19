import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../utils/supabaseClient';

export function useMultiplayer(levelId, currentPlayer) {
  const [peers, setPeers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [channelMode, setChannelMode] = useState('offline_sim');
  const channelRef = useRef(null);
  const lastBroadcastTime = useRef(0);

  // Simulated peer ghosts for runner track when live Supabase channel is in demo/offline mode
  const simGhostsRef = useRef([
    {
      id: 'kartikeya-ghost',
      username: 'Kartikeya (Swift Avatar)',
      x: -2.5, // Left lane
      targetX: -2.5,
      z: 45,
      speed: 16.5,
      color: '#00E5FF',
      aura: 'peacock',
      lane: 0
    },
    {
      id: 'deva-seeker',
      username: 'Deva Seeker (Gandharva)',
      x: 2.5, // Right lane
      targetX: 2.5,
      z: 25,
      speed: 14.8,
      color: '#FFD700',
      aura: 'golden',
      lane: 2
    },
    {
      id: 'agni-pilgrim',
      username: 'Agni Pilgrim',
      x: 0, // Center lane
      targetX: 0,
      z: 10,
      speed: 13.2,
      color: '#FF5722',
      aura: 'flame',
      lane: 1
    }
  ]);

  // Handle Supabase Realtime Channel: `global-track`
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !supabase) {
      setChannelMode('simulated_ghosts');
      setIsConnected(true);
      return;
    }

    try {
      const channel = supabase.channel('global-track', {
        config: {
          presence: { key: currentPlayer?.id || 'guest-seeker' },
        },
      });

      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const activePeers = [];
          Object.keys(state).forEach(key => {
            if (key !== currentPlayer?.id) {
              const p = state[key][0];
              if (p) activePeers.push(p);
            }
          });
          setPeers(activePeers);
        })
        .on('broadcast', { event: 'position_update' }, ({ payload }) => {
          if (payload.id === currentPlayer?.id) return;
          setPeers(prev => {
            const idx = prev.findIndex(p => p.id === payload.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = {
                ...copy[idx],
                ...payload,
                targetX: payload.x,
                targetZ: payload.z
              };
              return copy;
            } else {
              return [...prev, { ...payload, targetX: payload.x, targetZ: payload.z }];
            }
          });
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setChannelMode('live_supabase');
            channel.track({
              id: currentPlayer?.id,
              username: currentPlayer?.username || 'Mooshak Seeker',
              x: 0,
              z: 0
            });
          } else {
            setIsConnected(false);
          }
        });

      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
        }
      };
    } catch (e) {
      console.warn('Realtime channel fallback:', e);
      setChannelMode('simulated_ghosts');
      setIsConnected(true);
    }
  }, [currentPlayer?.id, currentPlayer?.username]);

  // Simulation loop for peer ghosts running along the 3-lane celestial track
  useEffect(() => {
    if (channelMode !== 'simulated_ghosts') return;

    const lanes = [-2.5, 0, 2.5];
    const interval = setInterval(() => {
      const updated = simGhostsRef.current.map(ghost => {
        // Occasionally switch lanes (5% chance)
        let targetLane = ghost.lane;
        if (Math.random() < 0.04) {
          targetLane = Math.floor(Math.random() * 3);
        }

        const newTargetX = lanes[targetLane];
        // Smooth lerp towards lane
        const newX = ghost.x + (newTargetX - ghost.x) * 0.15;
        const newZ = ghost.z + ghost.speed * 0.05;

        return {
          ...ghost,
          lane: targetLane,
          x: Number(newX.toFixed(2)),
          targetX: newTargetX,
          z: Number(newZ.toFixed(2))
        };
      });
      simGhostsRef.current = updated;
      setPeers(updated);
    }, 50); // 20 FPS smooth ghost movement

    return () => clearInterval(interval);
  }, [channelMode]);

  // Throttled position broadcasting (max 20 times/sec to conserve network)
  const broadcastPosition = useCallback((x, z, extra = {}) => {
    const now = Date.now();
    if (now - lastBroadcastTime.current < 50) return;
    lastBroadcastTime.current = now;

    if (channelRef.current && channelMode === 'live_supabase') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'position_update',
        payload: {
          id: currentPlayer?.id,
          username: currentPlayer?.username || 'Mooshak Seeker',
          x,
          z,
          ...extra
        }
      });
    }
  }, [channelMode, currentPlayer?.id, currentPlayer?.username]);

  return {
    peers,
    isConnected,
    channelMode,
    broadcastPosition
  };
}

export function joinMultiplayerTrack(playerState) {
  if (!isLiveSupabaseConfigured || !supabase) return null;
  const channel = supabase.channel('global-track', {
    config: { presence: { key: playerState.id } },
  });
  channel.subscribe();
  return channel;
}
