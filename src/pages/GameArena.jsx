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
  AlertOctagon,
  Pause,
  Play,
  Copy,
  Check,
  Flame,
  CloudCheck,
  Lock,
  LogIn
} from 'lucide-react';
import GameViewport from '../components/GameViewport';
import { TRACK_LANES } from '../utils/constants';
import RiddleModal from '../components/RiddleModal';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { RunnerTelemetryTracker } from '../utils/antiCheatClient';
import { audioEngine } from '../utils/audioEngine';
import { localAuth, supabase, isLiveSupabaseConfigured, logUserAction, unlockLoreLevel, CELESTIAL_GUEST_UUID } from '../utils/supabaseClient';

export default function GameArena({ onNavigate }) {
  // Player state & Auth
  const [currentUser, setCurrentUser] = useState(() => localAuth.getUser() || {
    id: CELESTIAL_GUEST_UUID,
    username: 'Celestial Seeker'
  });

  // Guest Trial Lock & Lore Level State
  const [isTrialLocked, setIsTrialLocked] = useState(() => {
    return !localAuth.isAuthenticated() && localAuth.isTrialCompleted();
  });
  const [loreLevel, setLoreLevel] = useState(() => currentUser?.wisdom_level || 1);

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
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, 'DASH!' or null
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [modaksCollected, setModaksCollected] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [revivesCount, setRevivesCount] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [milestoneToast, setMilestoneToast] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);

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
  const isPausedRef = useRef(false);
  const countdownRef = useRef(null);
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
  const lastModakTimeRef = useRef(0);
  const comboRef = useRef(0);
  const lastMilestoneRef = useRef(0);

  // Keep refs in sync with state for callbacks
  currentLaneRef.current = currentLane;
  isJumpingRef.current = isJumping;
  isSlidingRef.current = isSliding;
  isInvulnerableRef.current = isInvulnerable;
  isRunningRef.current = isRunning;
  isPausedRef.current = isPaused;
  countdownRef.current = countdown;
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
            username: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Seeker',
            email: data.user.email
          });
          setIsTrialLocked(false);
        }
      });
    }
  }, []);

  // Procedural Track Generator:
  const generateTrackSegment = useCallback((fromZ, toZ) => {
    const newObstacles = [];
    const newModaks = [];
    const obstacleTypes = ['rolling_pillar', 'fire_pit', 'floating_arch', 'demon_guardian'];

    for (let z = fromZ; z < toZ; z += 24) {
      // Safe runway: If z < 60, only place sweet golden modaks
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

      // Pick 1 or 2 lanes to block, leaving at least 1 open lane
      const blockedLaneIndices = [];
      const numBlocked = Math.random() < 0.65 ? 1 : 2;
      const shuffledLanes = [0, 1, 2].sort(() => 0.5 - Math.random());

      for (let i = 0; i < numBlocked; i++) {
        blockedLaneIndices.push(shuffledLanes[i]);
      }

      // Place obstacles in chosen lanes
      blockedLaneIndices.forEach((laneIdx) => {
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        newObstacles.push({
          id: `obs-${z}-${laneIdx}`,
          type,
          x: TRACK_LANES[laneIdx],
          y: type === 'floating_arch' ? 1.6 : 0.4,
          z,
          lane: laneIdx
        });
      });

      // Place Modaks in unblocked open lane
      const openLanes = [0, 1, 2].filter((idx) => !blockedLaneIndices.includes(idx));
      const rewardLane = openLanes[0] ?? 1;

      for (let offset = -4; offset <= 4; offset += 4) {
        newModaks.push({
          id: `modak-${z + offset}-${rewardLane}`,
          x: TRACK_LANES[rewardLane],
          y: 0.5,
          z: z + offset,
          collected: false
        });
      }
    }

    return { newObstacles, newModaks };
  }, []);

  // Initialize or Restart Runner Dash with 3-2-1 Countdown
  const startRun = useCallback(() => {
    if (!localAuth.isAuthenticated() && localAuth.isTrialCompleted()) {
      setIsTrialLocked(true);
      return;
    }

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
    setIsPaused(false);
    isPausedRef.current = false;
    setFoulMessage('');

    setElapsedTime(0);
    setDistanceTraveled(0);
    setModaksCollected(0);
    setMultiplier(1);
    setCombo(0);
    comboRef.current = 0;
    lastMilestoneRef.current = 0;
    setScore(0);
    setRevivesCount(0);
    setCurrentLevel(1);
    modaksCollectedRef.current = 0;
    distanceTraveledRef.current = 0;

    setIsRunning(false);
    isRunningRef.current = false;
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
    audioEngine.startAmbientDrone();

    // Trigger 3... 2... 1... DASH! countdown
    setCountdown(3);
    countdownRef.current = 3;
    audioEngine.playTempleBell(440);

    let count = 3;
    const countTimer = setInterval(() => {
      count -= 1;
      if (count === 2) {
        setCountdown(2);
        countdownRef.current = 2;
        audioEngine.playTempleBell(528);
      } else if (count === 1) {
        setCountdown(1);
        countdownRef.current = 1;
        audioEngine.playTempleBell(660);
      } else if (count === 0) {
        setCountdown('DASH!');
        countdownRef.current = 'DASH!';
        audioEngine.playTempleBell(880);
      } else {
        clearInterval(countTimer);
        setCountdown(null);
        countdownRef.current = null;
        setIsRunning(true);
        isRunningRef.current = true;
        lastFrameTime.current = performance.now();
        logUserAction('GAME_START', 'Devotee launched Celestial Dash on 3 cosmic lanes');
      }
    }, 850);
  }, [currentUser.id, generateTrackSegment]);

  useEffect(() => {
    if (!localAuth.isAuthenticated() && localAuth.isTrialCompleted()) {
      setIsTrialLocked(true);
      return;
    }
    startRun();
  }, [startRun]);

  // Timer Tick
  useEffect(() => {
    if (!isRunning || runFinished || isDivineGateOpen || isPaused) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, runFinished, isDivineGateOpen, isPaused]);

  // Lane Switch Control Handler
  const switchLane = useCallback((direction) => {
    if (!isRunningRef.current || runFinishedRef.current || isDivineGateOpenRef.current || isPausedRef.current) return;
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
      isPausedRef.current ||
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
      isPausedRef.current ||
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

  // Pause / Resume Toggle Handler
  const togglePause = useCallback(() => {
    if (runFinishedRef.current || isDivineGateOpenRef.current || countdownRef.current !== null) return;
    setIsPaused((prev) => {
      const nextP = !prev;
      isPausedRef.current = nextP;
      if (nextP) {
        audioEngine.playTempleBell(440);
      } else {
        lastFrameTime.current = performance.now();
        audioEngine.playTempleBell(660);
      }
      return nextP;
    });
  }, []);

  // Keyboard Event Listeners (WASD + Arrows + Space + Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }

      if (key === 'escape' || key === 'p') {
        togglePause();
        return;
      }

      if (key === 'arrowleft' || key === 'a') switchLane('left');
      if (key === 'arrowright' || key === 'd') switchLane('right');
      if (key === 'arrowup' || key === 'w' || key === ' ') triggerJump();
      if (key === 'arrowdown' || key === 's') triggerSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchLane, triggerJump, triggerSlide, togglePause]);

  // Touch Swipe Gesture Handlers (Mobile)
  const handleTouchStart = (e) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartPos.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 35) switchLane('right');
      else if (deltaX < -35) switchLane('left');
    } else {
      if (deltaY < -35) triggerJump();
      else if (deltaY > 35) triggerSlide();
    }
    touchStartPos.current = null;
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let active = true;

    const loop = (time) => {
      if (!active) return;

      const dt = Math.min((time - lastFrameTime.current) / 1000, 0.1);
      lastFrameTime.current = time;

      // Only advance if game is actively running, not paused, and not in trivia modal
      if (
        isRunningRef.current &&
        !runFinishedRef.current &&
        !isDivineGateOpenRef.current &&
        !isPausedRef.current &&
        countdownRef.current === null
      ) {
        // Dynamic speed curve
        const baseSpeed = 16.5;
        const speedBonus = Math.min(distanceTraveledRef.current * 0.008, 11.5);
        const speed = baseSpeed + speedBonus;

        // Advance runner Z
        const nextZ = playerZRef.current + speed * dt;
        playerZRef.current = nextZ;
        setPlayerZ(nextZ);
        setDistanceTraveled(nextZ);
        distanceTraveledRef.current = nextZ;

        // Smooth X lane lerping
        const targetX = TRACK_LANES[currentLaneRef.current];
        playerXRef.current += (targetX - playerXRef.current) * Math.min(1, 15 * dt);
        setPlayerX(playerXRef.current);

        // Level progressions
        const newLevel = Math.min(5, Math.floor(nextZ / 300) + 1);
        setCurrentLevel(newLevel);

        // Milestone Toasts
        const milestoneCheck = Math.floor(nextZ / 250) * 250;
        if (milestoneCheck > 0 && milestoneCheck > lastMilestoneRef.current) {
          lastMilestoneRef.current = milestoneCheck;
          setMilestoneToast(`⚡ ${milestoneCheck}m Celestial Milestone Reached!`);
          audioEngine.playDivineWisdomChime();
          logUserAction('MILESTONE', `Reached ${milestoneCheck}m on cosmic highway`, { distance: milestoneCheck });
          setTimeout(() => setMilestoneToast(null), 3000);
        }

        // 1. Anti-Cheat Telemetry recording
        if (telemetryRef.current) {
          telemetryRef.current.recordCheckpoint('move', playerXRef.current, nextZ);
        }

        // 2. Multiplayer Broadcast (every 100ms)
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

              // Combo tracking
              const now = performance.now();
              if (now - lastModakTimeRef.current < 2000) {
                comboRef.current += 1;
              } else {
                comboRef.current = 1;
              }
              lastModakTimeRef.current = now;
              setCombo(comboRef.current);

              setModaksCollected((c) => {
                const nextC = c + 1;
                setScore(Math.floor(nextZ * 10 + nextC * 75 * multiplier + comboRef.current * 15));
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

            if (Math.abs(obs.z - nextZ) < 1.15 && Math.abs(obs.x - playerXRef.current) < 1.05) {
              let avoided = false;

              if (obs.type === 'rolling_pillar' || obs.type === 'fire_pit') {
                if (isJumpingRef.current && jumpYRef.current > 0.75) {
                  avoided = true;
                }
              } else if (obs.type === 'floating_arch') {
                if (isSlidingRef.current) {
                  avoided = true;
                }
              }

              if (!avoided) {
                // FOUL TRIGGERED!
                audioEngine.playCollisionSound();

                // Remove obstacle
                const filteredObs = activeObstacles.filter((o) => o.id !== obs.id);
                obstaclesRef.current = filteredObs;
                setObstacles(filteredObs);

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

  // Handle Divine Gate Trivia Resolution
  const handleTriviaResolved = ({ puzzleId, startTime, solveTime, isCorrect }) => {
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

      // Advance mythological lore level in DB & local progression
      unlockLoreLevel(currentUser.id, loreLevel).then((res) => {
        if (res?.unlockedLevel) {
          setLoreLevel((prev) => Math.min(10, Math.max(prev, res.unlockedLevel + 1)));
        }
      }).catch(() => {});
      setLoreLevel((prev) => Math.min(prev + 1, 10));

      // Advance slightly past obstacle
      playerZRef.current += 3.5;
      setPlayerZ(playerZRef.current);

      // 3.0 Seconds Invulnerability grace period
      setIsInvulnerable(true);
      isInvulnerableRef.current = true;

      setTimeout(() => {
        setIsInvulnerable(false);
        isInvulnerableRef.current = false;
      }, 3000);

      audioEngine.playReviveFanfare();
      logUserAction('DIVINE_GATE_SOLVED', 'Solved Gemini AI mythological riddle and earned Divine Shield', { puzzleId });
    } else {
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

    if (!localAuth.isAuthenticated()) {
      localAuth.setTrialCompleted();
    }

    audioEngine.playShankhaBlast();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });

    try {
      const tracker = telemetryRef.current;
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
      logUserAction('GAME_COMPLETED', `Concluded run: ${finalDistance.toFixed(1)}m with ${finalModaks} Modaks. Score: ${data.authoritativeScore || score}`, {
        distance: finalDistance,
        score: data.authoritativeScore || score
      });
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

  // Copy shareable run card to clipboard
  const handleCopyShareCard = () => {
    const finalDist = distanceTraveled.toFixed(1);
    const shareText = `🛕 Celestial Dash: Mooshak's Quest\n🏆 Score: ${score} points\n⚡ Distance Dashed: ${finalDist}m\n🥮 Modaks Gathered: ${modaksCollected}\nCan you outrun Mooshak across Mount Kailash? Play now: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    audioEngine.playTempleBell(740);
    setTimeout(() => setCopiedShare(false), 2500);
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
          <div className="temple-glass rounded-2xl px-3.5 py-1.5 border border-gold-500/30 flex items-center gap-2 shadow-lg">
            <Gauge className="w-4 h-4 text-marigold" />
            <span className="font-mono text-sm sm:text-base font-bold text-amber-100">
              {distanceTraveled.toFixed(0)}m
            </span>
          </div>

          {/* Current Level Badge */}
          <div className="temple-glass rounded-2xl px-3 py-1.5 border border-saffron-500/30 bg-saffron-950/40 flex items-center gap-1.5 shadow-lg">
            <span className="text-xs font-bold text-amber-300 font-cinzel">
              Level {currentLevel}
            </span>
          </div>

          {/* Modak Count */}
          <div className="temple-glass rounded-2xl px-3 py-1.5 border border-gold-500/30 flex items-center gap-1.5 shadow-lg">
            <span className="text-base">🥮</span>
            <span className="text-xs sm:text-sm font-bold text-amber-200 font-mono">
              {modaksCollected}
            </span>
          </div>

          {/* Guest Trial Badge */}
          {!localAuth.isAuthenticated() && (
            <div className="temple-glass rounded-2xl px-3 py-1.5 border border-marigold/50 bg-amber-950/70 flex items-center gap-1.5 shadow-lg animate-pulse">
              <span className="text-xs">⚡</span>
              <span className="text-xs font-bold text-amber-200 font-cinzel">
                Free Trial Dash (1/1)
              </span>
            </div>
          )}
        </div>

        {/* Center HUD: Dynamic Score & Combo */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="temple-glass rounded-2xl px-4 py-1.5 border border-gold-divine/40 bg-saffron-950/50 flex items-center gap-2 shadow-xl">
            <Sparkles className="w-4 h-4 text-marigold animate-pulse" />
            <span className="text-xs uppercase font-cinzel text-amber-300 tracking-wider hidden sm:inline">
              Score:
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-100 font-mythic glow-text-gold">
              {score}
            </span>
          </div>

          {combo >= 2 && (
            <div className="temple-glass rounded-2xl px-2.5 py-1.5 border border-saffron-500/50 bg-saffron-900/40 text-amber-200 text-xs font-bold font-cinzel flex items-center gap-1 animate-pulse shadow-md">
              <Flame className="w-3.5 h-3.5 text-marigold fill-current" />
              <span>Streak x{combo}</span>
            </div>
          )}

          {multiplier > 1 && (
            <div className="temple-glass rounded-2xl px-2.5 py-1.5 border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs font-bold font-cinzel flex items-center gap-1 shadow-md">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              <span>{multiplier}x Multiplier</span>
            </div>
          )}
        </div>

        {/* Right HUD: Pause & Multiplayer Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="temple-glass rounded-2xl px-2.5 py-1.5 border border-gold-500/30 flex items-center gap-1.5 text-xs text-amber-200 shadow-md">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline font-cinzel">Ghost Racers:</span>
            <span className="font-bold text-cyan-300">{peers.length + 1}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </div>

          <button
            onClick={togglePause}
            title={isPaused ? 'Resume Dash' : 'Pause Dash (Esc)'}
            className="p-2 rounded-xl border border-gold-500/30 bg-cosmic-900/90 text-amber-300 hover:text-amber-100 hover:bg-cosmic-800 transition-colors shadow-lg cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Pre-Dash Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-cosmic-950/70 backdrop-blur-sm pointer-events-none">
          <div className="text-center animate-in zoom-in-75 duration-200">
            <span className="block text-7xl sm:text-9xl font-black font-mythic text-amber-200 glow-text-gold tracking-widest drop-shadow-[0_0_50px_rgba(255,215,0,0.9)]">
              {countdown}
            </span>
            <span className="block text-sm sm:text-base font-cinzel text-amber-300/80 uppercase tracking-widest mt-4">
              Mount Kailash Gates Opening...
            </span>
          </div>
        </div>
      )}

      {/* Floating Milestone Banner */}
      {milestoneToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in slide-in-from-top duration-300">
          <div className="px-6 py-2 rounded-2xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-cinzel font-bold text-sm uppercase tracking-widest shadow-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 fill-cosmic-950" />
            <span>{milestoneToast}</span>
          </div>
        </div>
      )}

      {/* Foul Alert Notification Banner */}
      {isFouled && !isDivineGateOpen && (
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

      {/* Pause Modal Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-saffron-950/60 border border-gold-400/40 mx-auto mb-3 flex items-center justify-center text-2xl">
              ⏸️
            </div>
            <h3 className="text-2xl font-bold font-mythic text-amber-100 glow-text-gold">
              Sacred Meditation
            </h3>
            <p className="text-xs text-amber-300/80 font-cinzel mt-1 mb-6">
              Cosmic Dash is temporarily paused
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs font-cinzel border-b border-gold-500/20 pb-2">
                <span className="text-amber-300/70">Distance Dashed:</span>
                <span className="font-mono text-amber-100 font-bold">{distanceTraveled.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between text-xs font-cinzel border-b border-gold-500/20 pb-2">
                <span className="text-amber-300/70">Modaks Gathered:</span>
                <span className="font-mono text-marigold font-bold">{modaksCollected} 🥮</span>
              </div>
              <div className="flex justify-between text-xs font-cinzel">
                <span className="text-amber-300/70">Current Score:</span>
                <span className="font-mono text-gold-divine font-bold">{score}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={togglePause}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-400 text-cosmic-950 font-bold font-cinzel text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Dash</span>
              </button>
              <button
                onClick={startRun}
                className="w-full py-2.5 rounded-xl border border-gold-500/30 hover:bg-white/5 text-amber-200 text-xs font-cinzel transition-colors cursor-pointer"
              >
                Restart Dash
              </button>
              <button
                onClick={() => onNavigate('/')}
                className="w-full py-2 rounded-xl text-amber-400/70 hover:text-amber-200 text-xs font-cinzel transition-colors cursor-pointer"
              >
                Return to Temple Realm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Tactical Bar (Desktop Controls) */}
      <div className="absolute bottom-4 left-4 pointer-events-auto z-20 hidden sm:block">
        <div className="temple-glass rounded-2xl p-3 border border-gold-500/20 text-xs space-y-1 max-w-xs shadow-xl">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold font-cinzel">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Cheat Telemetry Active</span>
          </div>
          <p className="text-[11px] text-amber-200/80 font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-cosmic-950 border border-gold-500/40 text-amber-300">A/&larr;</kbd> Left &bull;{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-cosmic-950 border border-gold-500/40 text-amber-300">D/&rarr;</kbd> Right &bull;{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-cosmic-950 border border-gold-500/40 text-amber-300">Space</kbd> Jump &bull;{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-cosmic-950 border border-gold-500/40 text-amber-300">S/&darr;</kbd> Slide
          </p>
        </div>
      </div>

      {/* Mobile Virtual Touch Controls */}
      <div className="absolute bottom-4 inset-x-4 sm:hidden pointer-events-auto z-20 flex items-center justify-between">
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

      {/* Divine Gate Trivia Modal */}
      <RiddleModal
        isOpen={isDivineGateOpen}
        foulMessage={foulMessage}
        distance={distanceTraveled}
        loreLevel={loreLevel}
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
            <p className="text-xs text-amber-300/80 font-cinzel mt-1 mb-5">
              "Mooshak's devotion shines across the celestial sphere"
            </p>

            {/* Run Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-cosmic-900/80 border border-gold-500/20 text-left shadow-inner">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Distance Dashed
                </span>
                <span className="text-lg font-bold text-amber-100 font-mono">
                  {distanceTraveled.toFixed(1)}m
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-cosmic-900/80 border border-gold-500/20 text-left shadow-inner">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Modaks Gathered
                </span>
                <span className="text-lg font-bold text-marigold font-mono">
                  {modaksCollected} 🥮
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-cosmic-900/80 border border-gold-500/20 text-left shadow-inner">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Divine Revives
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {revivesCount} Extra Lives
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-cosmic-900/80 border border-gold-500/20 text-left shadow-inner">
                <span className="block text-[11px] text-amber-400/70 font-cinzel uppercase">
                  Final Run Score
                </span>
                <span className="text-lg font-bold text-gold-divine font-mythic glow-text-gold">
                  {score}
                </span>
              </div>
            </div>

            {/* Guest Trial Completion Alert */}
            {!localAuth.isAuthenticated() && (
              <div className="p-4 rounded-2xl bg-saffron-950/80 border-2 border-gold-400 text-left mb-5 shadow-xl">
                <div className="flex items-center gap-2 text-amber-200 font-bold font-cinzel text-sm mb-1">
                  <Lock className="w-4 h-4 text-marigold" />
                  <span>Complimentary Free Trial Dash Concluded</span>
                </div>
                <p className="text-xs text-amber-300/80 font-cinzel leading-relaxed">
                  You've experienced Mount Kailash! Sign in with your Google account to unlock unlimited dashes, save your score to the official Supabase Leaderboard, and explore the 10 Sacred Ganesha Lore Chapters.
                </p>
                <button
                  onClick={() => onNavigate('/auth')}
                  className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Unlock Unlimited Dashing</span>
                </button>
              </div>
            )}

            {/* Anti-Cheat & Supabase Sync Status Feedback */}
            {isSubmitting ? (
              <div className="p-3.5 rounded-2xl bg-cosmic-900/60 border border-gold-500/30 flex items-center justify-center gap-2 text-xs text-amber-300 mb-5">
                <div className="w-4 h-4 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
                <span>Verifying runner telemetry & syncing to Supabase Cloud...</span>
              </div>
            ) : submissionResult ? (
              <div
                className={`p-3.5 rounded-2xl border mb-5 text-xs text-left ${
                  submissionResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <div className="flex items-center gap-2">
                    {submissionResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>
                      {submissionResult.success
                        ? `Official Score: ${submissionResult.authoritativeScore} (${submissionResult.wisdom_rank})`
                        : `Anti-Cheat Flag: ${submissionResult.reason}`}
                    </span>
                  </div>

                  {submissionResult.success && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Supabase Synced</span>
                    </span>
                  )}
                </div>
                <p className="opacity-80 leading-relaxed">
                  {submissionResult.success
                    ? 'Cryptographic HMAC signature verified. Your score and stats have been permanently etched into the Supabase database.'
                    : submissionResult.details || submissionResult.message}
                </p>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate('/leaderboard')}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                View Live Leaderboard
              </button>

              <button
                onClick={handleCopyShareCard}
                className="py-3 px-4 rounded-2xl border border-gold-500/40 hover:bg-white/5 text-amber-200 text-xs sm:text-sm font-cinzel transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedShare ? 'Copied to Clipboard!' : 'Share Score'}</span>
              </button>

              <button
                onClick={() => {
                  if (!localAuth.isAuthenticated() && localAuth.isTrialCompleted()) {
                    setIsTrialLocked(true);
                  } else {
                    startRun();
                  }
                }}
                className="py-3 px-4 rounded-2xl border border-gold-500/40 bg-saffron-950/40 hover:bg-saffron-900/50 text-amber-200 text-xs sm:text-sm font-cinzel transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Repeat className="w-4 h-4 text-marigold" />
                <span>Dash Again</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Trial Lockout Modal */}
      {isTrialLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/92 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-saffron-950/80 border border-gold-400/50 mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg">
              🔒
            </div>

            <h3 className="text-2xl font-bold font-mythic text-amber-100 glow-text-gold">
              Celestial Trial Concluded
            </h3>
            <p className="text-xs text-amber-300/90 font-cinzel mt-1 mb-5">
              1 Free Trial Match Completed
            </p>

            <div className="p-4 rounded-2xl bg-cosmic-900/80 border border-gold-500/30 text-xs text-amber-200/90 font-cinzel text-left space-y-2 mb-6 shadow-inner">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-marigold shrink-0" />
                <span>Sign in to unlock full celestial privileges:</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-amber-100/80 text-[11px]">
                <li>Unlimited dashes across Mount Kailash lanes</li>
                <li>Permanently sync scores to Supabase Leaderboard</li>
                <li>Answer 10 Chronological Ganesha Lore Chapters</li>
                <li>Customize your Devotee Display Name and Avatar</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('/auth')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google / Account</span>
              </button>

              <button
                onClick={() => onNavigate('/leaderboard')}
                className="w-full py-2.5 px-4 rounded-xl border border-gold-500/30 hover:bg-white/5 text-amber-200 text-xs font-cinzel transition-colors cursor-pointer"
              >
                View Live Leaderboard
              </button>

              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full py-2 px-4 rounded-xl text-amber-400/70 hover:text-amber-200 text-xs font-cinzel transition-colors cursor-pointer"
              >
                Explore Wisdom Codex & Lore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
