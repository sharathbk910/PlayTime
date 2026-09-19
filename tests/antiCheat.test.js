import { validateGameSession, generateClientSignature } from '../server/services/antiCheat.js';

console.log('🧪 Running Celestial Dash Runner Anti-Cheat Validation Test Suite...\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

// Test 1: Legitimate human player submission in 3D Runner
const validNonce = 'nonce_test_valid_runner_123';
const legitimateRunnerPayload = {
  user_id: 'mooshak-runner-108',
  username: 'Mooshak Devotee',
  distance_traveled: 320.5,
  duration_seconds: 24.5,
  modaks_collected: 18,
  client_nonce: validNonce,
  checkpoints: [
    { id: 'cp_start', t: 1000, x: 0, y: 0, z: 0 },
    { id: 'cp_1', t: 6000, x: -2.5, y: 0, z: 70 },
    { id: 'cp_2', t: 12000, x: 2.5, y: 0, z: 155 },
    { id: 'cp_3', t: 18000, x: 0, y: 0, z: 240 },
    { id: 'cp_finish', t: 25500, x: 0, y: 0, z: 320.5 }
  ],
  trivia_attempts: [
    {
      puzzle_id: 'trivia-1',
      start_time: 12000,
      solve_time: 14600, // 2.6 seconds - realistic human reading & comprehension
      answered_correctly: true
    }
  ]
};
legitimateRunnerPayload.hash_signature = generateClientSignature(legitimateRunnerPayload);

const result1 = validateGameSession(legitimateRunnerPayload);
assert(result1.valid === true, 'Legitimate runner session is accepted and cryptographically verified');
assert(result1.score > 4000, 'Legitimate runner score incorporates distance, modaks & trivia revive bonus');

// Test 2: Speed Hack (distance / duration exceeds 35 m/s or teleporting 500m in 2s)
const speedHackPayload = {
  ...legitimateRunnerPayload,
  distance_traveled: 1200.0,
  duration_seconds: 15.0, // 1200 / 15 = 80 m/s (limit is 35 m/s)
  client_nonce: 'nonce_hack_speed_456',
  checkpoints: [
    { id: 'cp_start', t: 1000, x: 0, y: 0, z: 0 },
    { id: 'cp_finish', t: 16000, x: 0, y: 0, z: 1200 }
  ]
};
speedHackPayload.hash_signature = generateClientSignature(speedHackPayload);

const result2 = validateGameSession(speedHackPayload);
assert(result2.valid === false && result2.reason === 'REJECTED_IMPOSSIBLE_SPEED', 'Impossible speed hack (>35 m/s) is rejected');

// Test 3: Modak Item Spawn Hack (collecting 100 modaks over 20 meters = 5 modaks/meter, limit is 2.0)
const itemHackPayload = {
  ...legitimateRunnerPayload,
  distance_traveled: 40.0,
  duration_seconds: 10.0,
  modaks_collected: 120, // 120 modaks in 40m = 3.0 density
  client_nonce: 'nonce_hack_item_789'
};
itemHackPayload.hash_signature = generateClientSignature(itemHackPayload);

const result3 = validateGameSession(itemHackPayload);
assert(result3.valid === false && result3.reason === 'REJECTED_IMPOSSIBLE_ITEM_DENSITY', 'Impossible Modak item spawn hack is rejected');

// Test 4: Instant solve bot (< 800ms to read and answer a 4-choice trivia question)
const botPayload = {
  ...legitimateRunnerPayload,
  client_nonce: 'nonce_hack_bot_101',
  trivia_attempts: [
    {
      puzzle_id: 'trivia-1',
      start_time: 5000,
      solve_time: 5120, // 120ms solve time
      answered_correctly: true
    }
  ]
};
botPayload.hash_signature = generateClientSignature(botPayload);

const result4 = validateGameSession(botPayload);
assert(result4.valid === false && result4.reason === 'REJECTED_INSTANT_SOLVE', 'Instant bot trivia solve is flagged and rejected');

// Test 5: Chronological timestamp tampering (backward time jump)
const timeTamperPayload = {
  ...legitimateRunnerPayload,
  client_nonce: 'nonce_hack_time_202',
  checkpoints: [
    { id: 'cp_start', t: 5000, x: 0, y: 0, z: 0 },
    { id: 'cp_corrupted', t: 4000, x: 0, y: 0, z: 50 } // Time went backward!
  ]
};
timeTamperPayload.hash_signature = generateClientSignature(timeTamperPayload);

const result5 = validateGameSession(timeTamperPayload);
assert(result5.valid === false && result5.reason === 'REJECTED_NON_MONOTONIC_TIMESTAMPS', 'Non-monotonic timestamp tampering is rejected');

// Test 6: Forged HMAC Signature
const forgedSignaturePayload = {
  ...legitimateRunnerPayload,
  client_nonce: 'nonce_hack_sig_303',
  hash_signature: 'forged_fake_hex_signature_99999999999999'
};

const result6 = validateGameSession(forgedSignaturePayload);
assert(result6.valid === false && result6.reason === 'REJECTED_SIGNATURE_MISMATCH', 'Forged HMAC signature is rejected');

console.log(`\nRunner Anti-Cheat Test Suite Summary: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
