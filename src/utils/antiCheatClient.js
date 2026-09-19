// Client-side runner telemetry tracking & cryptographic HMAC verification helper

// Browser SubtleCrypto SHA-256 HMAC
async function hmacSha256(message, secret = 'celestial_ganesha_divine_key_2026') {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class RunnerTelemetryTracker {
  constructor(userId) {
    this.userId = userId;
    this.nonce = `nonce_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.startTime = null;
    this.endTime = null;
    this.checkpoints = [];
    this.triviaAttempts = [];
  }

  start(initialX = 0, initialZ = 0) {
    this.startTime = Date.now();
    this.checkpoints = [
      {
        id: 'cp_start',
        t: this.startTime,
        x: Number(initialX.toFixed(2)),
        y: 0,
        z: Number(initialZ.toFixed(2))
      }
    ];
    this.triviaAttempts = [];
  }

  recordCheckpoint(id, x, z) {
    const now = Date.now();
    const last = this.checkpoints[this.checkpoints.length - 1];
    // Throttle checkpoint recordings to avoid flooding
    if (last && now - last.t < 200) return;

    this.checkpoints.push({
      id: `${id}_${this.checkpoints.length}`,
      t: now,
      x: Number(x.toFixed(2)),
      y: 0,
      z: Number(z.toFixed(2))
    });
  }

  recordTriviaAttempt(puzzleId, startTime, solveTime, answeredCorrectly) {
    this.triviaAttempts.push({
      puzzle_id: puzzleId,
      start_time: startTime,
      solve_time: solveTime,
      answered_correctly: answeredCorrectly
    });
  }

  async buildSubmissionPayload({
    username,
    distanceTraveled,
    modaksCollected,
    finalX = 0,
    finalZ = 0
  }) {
    this.endTime = Date.now();
    const durationSeconds = Math.max(
      1.0,
      Number(((this.endTime - this.startTime) / 1000.0).toFixed(2))
    );

    const distance = Number(distanceTraveled.toFixed(2));

    // Record finish checkpoint
    this.checkpoints.push({
      id: 'cp_finish',
      t: this.endTime,
      x: Number(finalX.toFixed(2)),
      y: 0,
      z: Number(finalZ.toFixed(2))
    });

    const hashPayload = [
      this.userId,
      distance.toFixed(2),
      durationSeconds.toFixed(2),
      modaksCollected,
      this.nonce
    ].join(':');

    const hashSignature = await hmacSha256(hashPayload);

    return {
      user_id: this.userId,
      username: username || 'Celestial Seeker',
      distance_traveled: distance,
      duration_seconds: durationSeconds,
      modaks_collected: modaksCollected,
      client_nonce: this.nonce,
      hash_signature: hashSignature,
      checkpoints: this.checkpoints,
      trivia_attempts: this.triviaAttempts,
      // Backward compatibility aliases
      completion_time_seconds: durationSeconds,
      puzzle_attempts: this.triviaAttempts
    };
  }
}

// Backward compatibility alias
export const RaceTelemetryTracker = RunnerTelemetryTracker;
