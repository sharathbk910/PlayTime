import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  ShieldCheck,
  Users,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Gauge,
  Heart,
  Repeat,
  AlertOctagon
} from 'lucide-react';
import GameViewport from '../components/GameViewport';
import { TRACK_LANES } from '../utils/constants';
import RiddleModal from '../components/RiddleModal';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { RunnerTelemetryTracker } from '../utils/antiCheatClient';
import { audioEngine } from '../utils/audioEngine';
import { localAuth, supabase, isLiveSupabaseConfigured } from '../utils/supabaseClient';

export default function GameArena({ onNavigate }) {
  // Player state & Auth
  const [currentUser, setCurrentUser] = useState(() => localAuth.getUser() || {
    id: `seeker-${Date.now().toString(36)}`,
    username: 'Celestial Seeker'
  });

  // Runner Coordinates & Physics State
  const [currentLane, setCurrentLane] = useState(1); // 0 = Left (+2.5), 1 = Center (0), 2 = Right (-2.5)
  const [playerZ, setPlayerZ] = useState(0);
  const [playerX, setPlayerX] = useState(0);
  const [jumpY, setJumpY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [isFouled, setIsFouled] = useState(false);
  const [foulMessage, setFoulMessage] = useState('');

  // Gameplay Run State
  const [isRunning, setIsRunning] = useState(false);
  const [runFinished, setRunFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [modaksCollected, setModaksCollected] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [score, setScore] = useState(0);
  const [revivesCount, setRevivesCount] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);

  // Divine Gate & Anti-Cheat Submissions
  const [isDivineGateOpen, setIsDivineGateOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Obstacles & Modaks Track Items
  const [obstacles, setObstacles] = useState([]);
  const [modaks, setModaks] = useState([]);

  // Refs for smooth 60FPS animation frame loop
  const playerZRef = useRef(0);
  const playerXRef = useRef(0);
  const jumpYRef = useRef(0);
  const currentLaneRef = useRef(1);
  const isJumpingRef = useRef(false);
  const isSlidingRef = useRef(false);
  const isInvulnerableRef = useRef(false);
  const isRunningRef = useRef(false);
  const isDivineGateOpenRef = useRef(false);
  const runFinishedRef = useRef(false);
  const obstaclesRef = useRef([]);
  const modaksRef = useRef([]);
  const nextSpawnZRef = useRef(240);
  const telemetryRef = useRef(null);
  const touchStartPos = useRef(null);
  const animFrameId = useRef(null);
  const lastFrameTime = useRef(performance.now());
  const lastBroadcastTime = useRef(0);
  const modaksCollectedRef = useRef(0);
  const distanceTraveledRef = useRef(0);

  // Keep refs in sync with state for callbacks
  currentLaneRef.current = currentLane;
  isJumpingRef.current = isJumping;
  isSlidingRef.current = isSliding;
  isInvulnerableRef.current = isInvulnerable;
  isRunningRef.current = isRunning;
  isDivineGateOpenRef.current = isDivineGateOpen;
  runFinishedRef.current = runFinished;
  obstaclesRef.current = obstacles;
  modaksRef.current = modaks;

  // Live Multiplayer Hook
  const { peers, isConnected, broadcastPosition } = useMultiplayer(1, currentUser);

  // Check auth on mount
  useEffect(() => {
    if (isLiveSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser({
            id: data.user.id,
            username: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Seeker'
          });
        }
      });
    }
  }, []);

  // Procedural Track Generator:
  // Ensures safe start runway (Z = 0 to 60 has NO obstacles, only modaks!)
  const generateTrackSegment = useCallback((fromZ, toZ) => {
    const newObstacles = [];
    const newModaks = [];
    const obstacleTypes = ['rolling_pillar', 'fire_pit', 'floating_arch', 'demon_guardian'];

    for (let z = fromZ; z < toZ; z += 24) {
      // If z < 60, only place sweet golden modaks for safe takeoff!
      if (z < 60) {
        for (let offset = -6; offset <= 6; offset += 3) {
          newModaks.push({
            id: `modak-${z + offset}-center`,
            x: TRACK_LANES[1], // Center lane
            y: 0.5,
            z: z + offset,
            collected: false
          });
        }
        continue;
      }

      // Pick 1 or 2 lanes to block, always leaving at least 1 open lane!
      const blockedLaneIndices = [];
      const numBlocked = Math.random() < 0.65 ? 1 : 2;

      while (blockedLaneIndices.length < numBlocked) {
        const randLane = Math.floor(Math.random() * 3);
        if (!blockedLaneIndices.includes(randLane)) {
          blockedLaneIndices.push(randLane);
        }
      }

      // Spawn obstacles in blocked lanes
      blockedLaneIndices.forEach((laneIdx) => {
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        newObstacles.push({
          id: `obs-${z}-${laneIdx}`,
          x: TRACK_LANES[laneIdx],
          z,
          type
        });
      });

      // Spawn Modaks in the open lane(s)
      const openLanes = [0, 1, 2].filter((l) => !blockedLaneIndices.includes(l));
      const modakLane = openLanes[Math.floor(Math.random() * openLanes.length)] ?? 1;

      for (let offset = -6; offset <= 6; offset += 3) {
        newModaks.push({
          id: `modak-${z + offset}-${modakLane}`,
          x: TRACK_LANES[modakLane],
          y: 0.5,
          z: z + offset,
          collected: false
        });
      }
    }

    return { newObstacles, newModaks };
  }, []);

  // Initialize or Restart Runner Dash
  const startRun = useCallback(() => {
    setCurrentLane(1);
    currentLaneRef.current = 1;
    playerZRef.current = 0;
    playerXRef.current = 0;
    jumpYRef.current = 0;
    setPlayerZ(0);
    setPlayerX(0);
    setJumpY(0);
    setIsJumping(false);
    setIsSliding(false);
    setIsInvulnerable(false);
    setIsFouled(false);
    setFoulMessage('');

    setElapsedTime(0);
    setDistanceTraveled(0);
    setModaksCollected(0);
    setMultiplier(1);
    setScore(0);
    setRevivesCount(0);
    setCurrentLevel(1);
    modaksCollectedRef.current = 0;
    distanceTraveledRef.current = 0;

    setIsRunning(true);
    setRunFinished(false);
    setIsDivineGateOpen(false);
    setSubmissionResult(null);

    // Initial safe track segment (0m to 240m)
    const { newObstacles, newModaks } = generateTrackSegment(15, 240);
    setObstacles(newObstacles);
    setModaks(newModaks);
    obstaclesRef.current = newObstacles;
    modaksRef.current = newModaks;
    nextSpawnZRef.current = 240;

    // Start Anti-Cheat Telemetry Tracker
    const tracker = new RunnerTelemetryTracker(currentUser.id);
    tracker.start(TRACK_LANES[1], 0);
    telemetryRef.current = tracker;

    lastFrameTime.current = performance.now();

    audioEngine.playTempleBell(528);
    audioEngine.startAmbientDrone();
  }, [currentUser.id, generateTrackSegment]);

  useEffect(() => {
    startRun();
  }, [startRun]);

  // Timer Tick
  useEffect(() => {
    if (!isRunning || runFinished || isDivineGateOpen) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, runFinished, isDivineGateOpen]);

  // Lane Switch Control Handler (Left = 0, Center = 1, Right = 2)
  const switchLane = useCallback((direction) => {
    if (!isRunningRef.current || runFinishedRef.current || isDivineGateOpenRef.current) return;
    setCurrentLane((prev) => {
      let next = prev;
      if (direction === 'left' && prev > 0) next = prev - 1;
      if (direction === 'right' && prev < 2) next = prev + 1;
      currentLaneRef.current = next;
      return next;
    });
  }, []);

  // Jump Control Handler
  const triggerJump = useCallback(() => {
    if (
      !isRunningRef.current ||
      runFinishedRef.current ||
      isDivineGateOpenRef.current ||
      isJumpingRef.current
    )
      return;

    setIsJumping(true);
    isJumpingRef.current = true;
    audioEngine.playJumpSound();

    let start = Date.now();
    const jumpDuration = 620; // ms

    const jumpInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = elapsed / jumpDuration;

      if (progress >= 1) {
        clearInterval(jumpInterval);
        jumpYRef.current = 0;
        setJumpY(0);
        setIsJumping(false);
        isJumpingRef.current = false;
      } else {
        // Parabolic jump arc peaking at 1.85m
        const y = Math.sin(progress * Math.PI) * 1.85;
        jumpYRef.current = y;
        setJumpY(y);
      }
    }, 16);
  }, []);

  // Slide Control Handler
  const triggerSlide = useCallback(() => {
    if (
      !isRunningRef.current ||
      runFinishedRef.current ||
      isDivineGateOpenRef.current ||
      isSlidingRef.current
    )
      return;

    setIsSliding(true);
    isSlidingRef.current = true;
    audioEngine.playSlideSound();

    setTimeout(() => {
      setIsSliding(false);
      isSlidingRef.current = false;
    }, 680);
  }, []);

  // Keyboard Event Listeners (WASD + Arrows + Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }

      if (key === 'arrowleft' || key === 'a') switchLane('left');
      if (key === 'arrowright' || key === 'd') switchLane('right');
      if (key === 'arrowup' || key === 'w' || key === ' ') triggerJump();
      if (key === 'arrowdown' || key === 's') triggerSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchLane, triggerJump, triggerSlide]);

  // Touch Swipe Event Listeners (Mobile Gesture Support)
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartPos.current || !e.changedTouches || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartPos.current.x;
    const dy = e.changedTouches[0].clientY - touchStartPos.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 28) {
      if (absDx > absDy) {
        if (dx > 0) switchLane('right');
        else switchLane('left');
      } else {
        if (dy < 0) triggerJump();
        else triggerSlide();
      }
    }
    touchStartPos.current = null;
  };

  // High Performance 60FPS Animation Frame Physics Loop
  useEffect(() => {
    let active = true;

    const loop = (time) => {
      if (!active) return;

      const deltaMs = Math.min(60, time - lastFrameTime.current);
      lastFrameTime.current = time;
      const dt = deltaMs / 1000;

      if (isRunningRef.current && !runFinishedRef.current && !isDivineGateOpenRef.current) {
        // Runner Speed: comfortable, controlled, fair pacing
        // Base speed: 7.5 m/s, gradually increases with distance up to 13 m/s
        const currentZ = playerZRef.current;
        const currentSpeed = 7.5 + Math.min(5.5, (currentZ / 100) * 1.2);
        const nextZ = currentZ + currentSpeed * dt;
        playerZRef.current = nextZ;

        // Smoothly interpolate playerX towards target lane
        const targetX = TRACK_LANES[currentLaneRef.current];
        playerXRef.current += (targetX - playerXRef.current) * Math.min(1, dt * 14);

        // Update React rendering states
        setPlayerZ(nextZ);
        setPlayerX(playerXRef.current);
        const dist = Number(nextZ.toFixed(1));
        distanceTraveledRef.current = dist;
        setDistanceTraveled(dist);

        // Level Milestones: Level 1 (0-150m), Level 2 (150-300m), Level 3 (300-500m)...
        const newLevel = Math.floor(nextZ / 150) + 1;
        setCurrentLevel(newLevel);

        // 1. Anti-Cheat Checkpoint
        if (telemetryRef.current) {
          telemetryRef.current.recordCheckpoint('move', playerXRef.current, nextZ);
        }

        // 2. Throttled Multiplayer Broadcast (every 100ms)
        if (time - lastBroadcastTime.current > 100) {
          lastBroadcastTime.current = time;
          broadcastPosition(Number(playerXRef.current.toFixed(2)), Number(nextZ.toFixed(2)), {
            score: Math.floor(nextZ * 10),
            isJumping: isJumpingRef.current,
            isSliding: isSlidingRef.current
          });
        }

        // 3. Modak Collectibles Collision Detection
        const activeModaks = modaksRef.current;
        let modakPicked = false;

        for (let i = 0; i < activeModaks.length; i++) {
          const m = activeModaks[i];
          if (!m.collected && Math.abs(m.z - nextZ) < 1.4 && Math.abs(m.x - playerXRef.current) < 1.1) {
            if (Math.abs(jumpYRef.current - m.y) < 1.3) {
              m.collected = true;
              modakPicked = true;
              audioEngine.playModakPickup();
              modaksCollectedRef.current += 1;
              setModaksCollected((c) => {
                const nextC = c + 1;
                setScore(Math.floor(nextZ * 10 + nextC * 75 * multiplier));
                return nextC;
              });
            }
          }
        }
        if (modakPicked) {
          setModaks([...activeModaks]);
        }

        // 4. Obstacle Collision Detection (FOUL CHECK)
        if (!isInvulnerableRef.current) {
          const activeObstacles = obstaclesRef.current;

          for (let i = 0; i < activeObstacles.length; i++) {
            const obs = activeObstacles[i];

            // Check if Mooshak is within the obstacle's bounding box
            if (Math.abs(obs.z - nextZ) < 1.15 && Math.abs(obs.x - playerXRef.current) < 1.05) {
              let avoided = false;

              if (obs.type === 'rolling_pillar' || obs.type === 'fire_pit') {
                // Low obstacles: must jump with adequate height
                if (isJumpingRef.current && jumpYRef.current > 0.75) {
                  avoided = true;
                }
              } else if (obs.type === 'floating_arch') {
                // High obstacles: must slide under
                if (isSlidingRef.current) {
                  avoided = true;
                }
              }

              if (!avoided) {
                // FOUL TRIGGERED!
                audioEngine.playCollisionSound();

                // Remove this obstacle so it never collides again
                const filteredObs = activeObstacles.filter((o) => o.id !== obs.id);
                obstaclesRef.current = filteredObs;
                setObstacles(filteredObs);

                // Set Foul State & Pause
                setIsFouled(true);
                setFoulMessage(
                  obs.type === 'rolling_pillar'
                    ? 'Foul: Hit a Rolling Pillar! Jump over low obstacles!'
                    : obs.type === 'fire_pit'
                    ? 'Foul: Touched a Sacred Fire Pit! Leap across fire rifts!'
                    : obs.type === 'floating_arch'
                    ? 'Foul: Struck by an Asura Barrier! Slide underneath high arches!'
                    : 'Foul: Intercepted by an Asura Spirit! Switch lanes to dodge!'
                );

                isDivineGateOpenRef.current = true;
                setIsDivineGateOpen(true);
                break;
              }
            }
          }
        }

        // 5. Procedurally spawn more track tiles ahead
        if (nextZ + 120 > nextSpawnZRef.current) {
          const spawnFrom = nextSpawnZRef.current;
          const spawnTo = spawnFrom + 180;
          const { newObstacles, newModaks } = generateTrackSegment(spawnFrom, spawnTo);

          const updatedObs = [
            ...obstaclesRef.current.filter((o) => o.z > nextZ - 30),
            ...newObstacles
          ];
          const updatedModaks = [
            ...modaksRef.current.filter((m) => m.z > nextZ - 30),
            ...newModaks
          ];

          obstaclesRef.current = updatedObs;
          modaksRef.current = updatedModaks;
          setObstacles(updatedObs);
          setModaks(updatedModaks);
          nextSpawnZRef.current = spawnTo;
        }
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [generateTrackSegment, multiplier, broadcastPosition]);

  // Handle Divine Gate Trivia Resolution (Clear Foul & Extra Life vs Run Concluded)
  const handleTriviaResolved = ({ puzzleId, startTime, solveTime, isCorrect }) => {
    // Record puzzle telemetry for anti-cheat
    if (telemetryRef.current) {
      telemetryRef.current.recordTriviaAttempt(puzzleId, startTime, solveTime, isCorrect);
    }

    if (isCorrect) {
      // FOUL CLEARED!
      setIsDivineGateOpen(false);
      isDivineGateOpenRef.current = false;
      setIsFouled(false);
      setFoulMessage('');

      setRevivesCount((r) => r + 1);
      setMultiplier((m) => m + 1);

      // Advance player slightly past obstacle location so no re-collision occurs
      playerZRef.current += 3.5;
      setPlayerZ(playerZRef.current);

      // 3.0 Seconds Invulnerability grace period with glowing shield
      setIsInvulnerable(true);
      isInvulnerableRef.current = true;

      setTimeout(() => {
        setIsInvulnerable(false);
        isInvulnerableRef.current = false;
      }, 3000);

      audioEngine.playReviveFanfare();
    } else {
      // Run concluded
      setIsDivineGateOpen(false);
      isDivineGateOpenRef.current = false;
      handleFinishRun();
    }
  };

  // Trigger End of Run & Anti-Cheat Submission
  const handleFinishRun = async () => {
    if (runFinishedRef.current || isSubmitting) return;
    setIsRunning(false);
    isRunningRef.current = false;
    setRunFinished(true);
    runFinishedRef.current = true;
    setIsSubmitting(true);

    audioEngine.playShankhaBlast();
    confetti({
      particleCount: 110,
      spread: 70,
      origin: { y: 0.6 }
    });

    try {
      const tracker = telemetryRef.current;
      // Use refs to get accurate final values (avoids stale React state closures)
      const finalDistance = distanceTraveledRef.current || playerZRef.current;
      const finalModaks = modaksCollectedRef.current;
      const payload = await tracker.buildSubmissionPayload({
        username: currentUser.username,
        distanceTraveled: finalDistance,
        modaksCollected: finalModaks,
        finalX: playerXRef.current,
        finalZ: playerZRef.current
      });

      const response = await fetch('/api/scores/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setSubmissionResult(data);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmissionResult({
        success: false,
        message: 'Network error submitting score to Celestial Leaderboard'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative w-full h-[calc(100vh-4.5rem)] overflow-hidden bg-cosmic-950 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Celestial Runner Viewport */}
      <GameViewport
        playerX={playerX}
        playerY={jumpY}
        playerZ={playerZ}
        isJumping={isJumping}
        isSliding={isSliding}
        isInvulnerable={isInvulnerable}
        isFouled={isFouled}
        obstacles={obstacles}
        modaks={modaks}
        ghosts={peers}
      />

      {/* Top Floating Runner HUD */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-6 flex items-center justify-between pointer-events-none z-20">
        {/* Left HUD: Distance & Level */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Distance Counter */}
          <div className="temple-glass rounded-xl px-3 py-1.5 border border-gold-500/30 flex items-center gap-2 shadow-lg">
            <Gauge className="w-4 h-4 text-marigold" />
            <span className="font-mono text-sm sm:text-base font-bold text-amber-100">
              {distanceTraveled.toFixed(0)}m
            </span>
          </div>

          {/* Current Level Badge */}
          <div className="temple-glass rounded-xl px-3 py-1.5 border border-saffron-500/30 bg-saffron-950/40 flex items-center gap-1.5 shadow-lg">
            <span className="text-xs font-bold text-amber-300 font-cinzel">
              Level {currentLevel}
            </span>
          </div>

          {/* Modak Count */}
          <div className="temple-glass rounded-xl px-3 py-1.5 border border-gold-500/30 flex items-center gap-1.5 shadow-lg">
            <span className="text-base">🥮</span>
            <span className="text-xs sm:text-sm font-bold text-amber-200 font-cinzel">
              {modaksCollected}
            </span>
          </div>
        </div>

        {/* Center HUD: Dynamic Score & Multiplier */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="temple-glass rounded-xl px-4 py-1.5 border border-gold-divine/40 bg-saffron-950/40 flex items-center gap-2 shadow-xl">
            <Sparkles className="w-4 h-4 text-marigold animate-pulse" />
            <span className="text-xs uppercase font-cinzel text-amber-300 tracking-wider">
              Score:
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-100 font-mythic">
              {score}
            </span>
          </div>

          {multiplier > 1 && (
            <div className="temple-glass rounded-xl px-2.5 py-1.5 border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs font-bold font-cinzel flex items-center gap-1 animate-bounce">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              <span>{multiplier}x Multiplier</span>
            </div>
          )}
        </div>

        {/* Right HUD: Ghost Multiplayer Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="temple-glass rounded-xl px-2.5 py-1.5 border border-gold-500/30 flex items-center gap-1.5 text-xs text-amber-200">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline font-cinzel">Ghost Racers:</span>
            <span className="font-bold text-cyan-300">{peers.length + 1}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </div>
        </div>
      </div>

      {/* Foul Alert Notification Banner */}
      {isFouled && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="px-5 py-2 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-100 font-cinzel text-xs sm:text-sm font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce">
            <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse" />
            <span>{foulMessage || 'FOUL! Obstacle Encountered!'}</span>
          </div>
        </div>
      )}

      {/* Invulnerability Shield Active Indicator */}
      {isInvulnerable && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-saffron-600 to-gold-400 text-cosmic-950 font-cinzel text-xs font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Divine Invulnerability Shield Active</span>
          </div>
        </div>
      )}

      {/* Bottom Floating Tactical Bar (Desktop Keyboard Controls Info) */}
      <div className="absolute bottom-4 left-4 pointer-events-auto z-20 hidden sm:block">
        <div className="temple-glass rounded-2xl p-3 border border-gold-500/20 text-xs space-y-1 max-w-xs shadow-xl">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold font-cinzel">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Celestial Anti-Cheat: Telemetry Active</span>
          </div>
          <p className="text-[11px] text-amber-200/80">
            <span className="text-amber-100 font-mono">A / &larr;</span>: Move Left &bull;{' '}
            <span className="text-amber-100 font-mono">D / &rarr;</span>: Move Right &bull;{' '}
            <span className="text-amber-100 font-mono">W / &uarr; / Space</span>: Jump &bull;{' '}
            <span className="text-amber-100 font-mono">S / &darr;</span>: Slide
          </p>
        </div>
      </div>

      {/* Mobile Virtual Touch Controls (Left, Right, Jump, Slide) */}
      <div className="absolute bottom-4 inset-x-4 sm:hidden pointer-events-auto z-20 flex items-center justify-between">
        {/* Left / Right Lane Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => switchLane('left')}
            className="w-13 h-13 rounded-2xl bg-cosmic-900/90 border border-gold-500/40 text-amber-300 flex items-center justify-center active:bg-saffron-600 shadow-xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => switchLane('right')}
            className="w-13 h-13 rounded-2xl bg-cosmic-900/90 border border-gold-500/40 text-amber-300 flex items-center justify-center active:bg-saffron-600 shadow-xl"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Jump & Slide Buttons */}
        <div className="flex gap-2">
          <button
            onClick={triggerSlide}
            className="w-13 h-13 rounded-2xl bg-cosmic-900/90 border border-gold-500/40 text-amber-300 flex flex-col items-center justify-center active:bg-saffron-600 shadow-xl"
          >
            <ArrowDown className="w-5 h-5" />
            <span className="text-[9px] font-cinzel font-bold">SLIDE</span>
          </button>
          <button
            onClick={triggerJump}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-saffron-600 to-gold-400 text-cosmic-950 flex flex-col items-center justify-center active:scale-95 shadow-xl font-bold"
          >
            <ArrowUp className="w-5 h-5" />
            <span className="text-[9px] font-cinzel">JUMP</span>
          </button>
        </div>
      </div>

      {/* Divine Gate Trivia Modal (Triggered when hitting an obstacle / foul) */}
      <RiddleModal
        isOpen={isDivineGateOpen}
        foulMessage={foulMessage}
        distance={distanceTraveled}
        onClose={() => {
          setIsDivineGateOpen(false);
          isDivineGateOpenRef.current = false;
        }}
        onAnswerResolved={handleTriviaResolved}
        onGiveUp={() => {
          setIsDivineGateOpen(false);
          isDivineGateOpenRef.current = false;
          handleFinishRun();
        }}
      />

      {/* Run Over / Anti-Cheat Score Submission Modal */}
      {runFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Crown Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-saffron-600 to-gold-400 p-[2px] mx-auto mb-4 shadow-lg shadow-saffron-600/40">
              <div className="w-full h-full rounded-2xl bg-cosmic-950 flex items-center justify-center text-3xl">
                🏆
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-mythic text-amber-100 glow-text-gold">
              Celestial Dash Concluded!
            </h3>
            <p className="text-xs text-amber-300/80 font-cinzel mt-1 mb-6">
              "Mooshak's devotion shines across the celestial sphere"
            </p>

            {/* Run Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-cosmic-900/80 border border-gold-500/20 text-left">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Distance Dashed
                </span>
                <span className="text-lg font-bold text-amber-100 font-mono">
                  {distanceTraveled.toFixed(1)}m
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cosmic-900/80 border border-gold-500/20 text-left">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Modaks Gathered
                </span>
                <span className="text-lg font-bold text-marigold font-mono">
                  {modaksCollected}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cosmic-900/80 border border-gold-500/20 text-left">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Fouls Cleared (Revives)
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {revivesCount} Extra Lives
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cosmic-900/80 border border-gold-500/20 text-left">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Final Run Score
                </span>
                <span className="text-lg font-bold text-gold-divine font-mythic glow-text-gold">
                  {score}
                </span>
              </div>
            </div>

            {/* Anti-Cheat Verification Feedback */}
            {isSubmitting ? (
              <div className="p-3 rounded-xl bg-cosmic-900/60 border border-gold-500/30 flex items-center justify-center gap-2 text-xs text-amber-300 mb-6">
                <div className="w-4 h-4 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
                <span>Verifying runner telemetry via Celestial Anti-Cheat...</span>
              </div>
            ) : submissionResult ? (
              <div
                className={`p-3.5 rounded-xl border mb-6 text-xs text-left ${
                  submissionResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {submissionResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>
                    {submissionResult.success
                      ? `Authoritative Score: ${submissionResult.authoritativeScore} (${submissionResult.wisdom_rank})`
                      : `Anti-Cheat Flag: ${submissionResult.reason}`}
                  </span>
                </div>
                <p className="opacity-80">
                  {submissionResult.success
                    ? 'Cryptographic HMAC signature validated. Your official contest rank has been permanently etched on the leaderboard.'
                    : submissionResult.details || submissionResult.message}
                </p>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate('/leaderboard')}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all"
              >
                View Contest Leaderboard
              </button>

              <button
                onClick={startRun}
                className="py-3 px-4 rounded-xl border border-gold-500/30 hover:bg-white/5 text-amber-200 text-xs sm:text-sm font-cinzel transition-colors flex items-center justify-center gap-1.5"
              >
                <Repeat className="w-4 h-4" />
                <span>Dash Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
