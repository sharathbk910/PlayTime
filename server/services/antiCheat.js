import { z } from 'zod';
import crypto from 'crypto';

const ANTI_CHEAT_SECRET = process.env.ANTI_CHEAT_SECRET || 'celestial_ganesha_divine_key_2026';

// Physical runner constraints
const MAX_RUNNER_SPEED_UNITS_PER_SEC = 35.0; // Max legitimate sprinting speed
const MAX_MODAK_DENSITY_PER_UNIT = 2.0;       // Max collectible density per meter of track
const MINIMUM_TRIVIA_READ_TIME_SEC = 0.8;    // Minimum human reading threshold for 4-choice questions

export const runnerSessionSubmissionSchema = z.object({
  user_id: z.string().min(1),
  username: z.string().optional().default('Celestial Seeker'),
  // Runner metrics
  distance_traveled: z.number().nonnegative().optional(),
  modaks_collected: z.number().int().nonnegative().default(0),
  duration_seconds: z.number().positive().min(0.5).optional(),
  // Backward-compatibility legacy field support
  completion_time_seconds: z.number().positive().optional(),
  level_number: z.number().int().optional(),
  wisdom_points: z.number().int().optional(),
  pradakshina_completed: z.boolean().optional(),
  // Security credentials
  client_nonce: z.string().min(4),
  hash_signature: z.string().min(8),
  checkpoints: z.array(
    z.object({
      id: z.string(),
      t: z.number(), // timestamp in ms
      x: z.number().optional().default(0),
      y: z.number().optional().default(0),
      z: z.number()
    })
  ).min(2),
  trivia_attempts: z.array(
    z.object({
      puzzle_id: z.string(),
      start_time: z.number(),
      solve_time: z.number(),
      answered_correctly: z.boolean()
    })
  ).optional().default([]),
  puzzle_attempts: z.array(
    z.object({
      puzzle_id: z.string(),
      start_time: z.number(),
      solve_time: z.number(),
      answered_correctly: z.boolean()
    })
  ).optional().default([])
});

/**
 * Validates a Celestial Dash runner session submission against anti-cheat invariants
 */
export function validateGameSession(rawPayload) {
  const parseResult = runnerSessionSubmissionSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    return {
      valid: false,
      reason: 'INVALID_PAYLOAD_STRUCTURE',
      details: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    };
  }

  const data = parseResult.data;

  // Normalize duration & distance
  const duration = Number((data.duration_seconds || data.completion_time_seconds || 1.0).toFixed(2));
  const distance = typeof data.distance_traveled === 'number'
    ? Number(data.distance_traveled.toFixed(2))
    : (data.checkpoints[data.checkpoints.length - 1].z || 10.0);

  const modaks = data.modaks_collected || 0;
  const triviaList = data.trivia_attempts.length > 0 ? data.trivia_attempts : data.puzzle_attempts;

  // 1. Minimum physical time check (cannot finish in < 0.5s)
  if (duration < 0.5) {
    return {
      valid: false,
      reason: 'REJECTED_IMPOSSIBLE_TIME',
      details: `Duration of ${duration}s is below minimum threshold.`
    };
  }

  // 2. Speed hack check: (distance / duration)
  const avgSpeed = distance / duration;
  if (avgSpeed > MAX_RUNNER_SPEED_UNITS_PER_SEC) {
    return {
      valid: false,
      reason: 'REJECTED_IMPOSSIBLE_SPEED',
      details: `Velocity of ${avgSpeed.toFixed(2)} units/sec exceeds max physical speed limit (${MAX_RUNNER_SPEED_UNITS_PER_SEC} units/sec). Speed hack or teleportation detected.`
    };
  }

  // 3. Modak item spawn hack check: (modaks / distance)
  // Allow slightly higher density at very low distances (< 10 units)
  const allowedDensity = distance < 10 ? 4.0 : MAX_MODAK_DENSITY_PER_UNIT;
  const modakDensity = modaks / Math.max(1, distance);
  if (modakDensity > allowedDensity) {
    return {
      valid: false,
      reason: 'REJECTED_IMPOSSIBLE_ITEM_DENSITY',
      details: `Modak density of ${modakDensity.toFixed(2)} modaks/unit exceeds maximum track threshold (${allowedDensity}). Item spawn hack suspected.`
    };
  }

  // 4. Monotonicity & Speed check across consecutive checkpoints
  const checkpoints = data.checkpoints;
  for (let i = 1; i < checkpoints.length; i++) {
    const prev = checkpoints[i - 1];
    const curr = checkpoints[i];

    const deltaMs = curr.t - prev.t;
    if (deltaMs <= 0) {
      return {
        valid: false,
        reason: 'REJECTED_NON_MONOTONIC_TIMESTAMPS',
        details: `Checkpoint sequence contains non-monotonic time jump from ${prev.id} to ${curr.id} (${deltaMs}ms). Time tampering detected.`
      };
    }

    // Skip segment speed check if there was a long pause (e.g., during Divine Gate trivia)
    // Trivia can take 30+ seconds; we only check segments with short delta times
    if (deltaMs > 8000) continue;

    const deltaSec = deltaMs / 1000.0;
    const dx = (curr.x || 0) - (prev.x || 0);
    const dy = (curr.y || 0) - (prev.y || 0);
    const dz = curr.z - prev.z;
    const segmentDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const segmentSpeed = segmentDist / deltaSec;

    // Use 2.5x multiplier to account for interpolation artifacts at checkpoint boundaries
    if (segmentSpeed > MAX_RUNNER_SPEED_UNITS_PER_SEC * 2.5) {
      return {
        valid: false,
        reason: 'REJECTED_IMPOSSIBLE_SPEED',
        details: `Instantaneous velocity spike of ${segmentSpeed.toFixed(2)} units/sec between checkpoints. Teleportation suspected.`
      };
    }
  }

  // 5. Human reading & comprehension duration check on trivia solves
  for (const trivia of triviaList) {
    if (trivia.answered_correctly) {
      const solveDurationSec = (trivia.solve_time - trivia.start_time) / 1000.0;
      if (solveDurationSec < MINIMUM_TRIVIA_READ_TIME_SEC) {
        return {
          valid: false,
          reason: 'REJECTED_INSTANT_SOLVE',
          details: `Trivia question ${trivia.puzzle_id} was answered in ${solveDurationSec.toFixed(3)}s, which is below human cognitive threshold.`
        };
      }
    }
  }

  // 6. Cryptographic HMAC verification
  const isLegacy = typeof data.distance_traveled === 'undefined' && typeof data.level_number === 'number';
  let expectedHashPayload;

  if (isLegacy) {
    expectedHashPayload = [
      data.user_id,
      data.level_number || 1,
      duration.toFixed(2),
      data.wisdom_points || 0,
      modaks,
      data.pradakshina_completed ? '1' : '0',
      data.client_nonce
    ].join(':');
  } else {
    expectedHashPayload = [
      data.user_id,
      distance.toFixed(2),
      duration.toFixed(2),
      modaks,
      data.client_nonce
    ].join(':');
  }

  const hmac = crypto.createHmac('sha256', ANTI_CHEAT_SECRET);
  hmac.update(expectedHashPayload);
  const expectedSignature = hmac.digest('hex');

  if (data.hash_signature !== expectedSignature) {
    return {
      valid: false,
      reason: 'REJECTED_SIGNATURE_MISMATCH',
      details: 'Payload HMAC signature does not match cryptographic verification token.'
    };
  }

  // 7. Calculate server-authoritative score
  // Distance points (10 pts per meter) + Modak points (75 pts each) + Trivia Revive points (200 pts each)
  const distancePoints = Math.floor(distance * 10);
  const modakPoints = modaks * 75;
  const triviaBonus = triviaList.filter(t => t.answered_correctly).length * 200;
  const authoritativeScore = distancePoints + modakPoints + triviaBonus;

  return {
    valid: true,
    score: authoritativeScore,
    distance,
    duration,
    modaks,
    details: 'Verified by Celestial Anti-Cheat Engine',
    metrics: {
      authoritativeScore,
      distancePoints,
      modakPoints,
      triviaBonus,
      distanceTraveled: distance,
      durationSeconds: duration,
      avgSpeed: Number(avgSpeed.toFixed(2))
    }
  };
}

/**
 * Generates client HMAC signature for legitimate runner submissions
 */
export function generateClientSignature(payload, secret = ANTI_CHEAT_SECRET) {
  const isLegacy = typeof payload.distance_traveled === 'undefined' && typeof payload.level_number === 'number';
  let hashPayload;

  if (isLegacy) {
    hashPayload = [
      payload.user_id,
      payload.level_number || 1,
      Number(payload.completion_time_seconds || payload.duration_seconds).toFixed(2),
      payload.wisdom_points || 0,
      payload.modaks_collected || 0,
      payload.pradakshina_completed ? '1' : '0',
      payload.client_nonce
    ].join(':');
  } else {
    hashPayload = [
      payload.user_id,
      Number(payload.distance_traveled).toFixed(2),
      Number(payload.duration_seconds).toFixed(2),
      payload.modaks_collected || 0,
      payload.client_nonce
    ].join(':');
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(hashPayload);
  return hmac.digest('hex');
}
