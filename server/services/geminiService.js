import { GoogleGenAI } from '@google/genai';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read local fallback trivia
const localTriviaPath = path.resolve(__dirname, '../data/localTrivia.json');
let fallbackTrivia = [];
try {
  const fileData = fs.readFileSync(localTriviaPath, 'utf8');
  fallbackTrivia = JSON.parse(fileData);
} catch (err) {
  console.warn('Could not load local trivia file, using default fallback object');
  fallbackTrivia = [
    {
      id: 'fallback-0',
      topic: 'The Divine Vahana',
      question: 'Why does Lord Ganesha, the lord of wisdom, ride upon Mooshak the mouse?',
      options: [
        'Mooshak symbolizes wild desires of the mind, tamed by intellect and wisdom',
        'Because mice can travel through secret cosmic tunnels',
        'Mooshak was a winged steed in Satya Yuga',
        'Because Mount Kailash trails are too narrow for elephants'
      ],
      correct_index: 0,
      wisdom_explanation: 'The mouse represents relentless mundane desires. Ganesha sitting atop Mooshak demonstrates intellect guiding and mastering desire.',
      divine_blessing: '+200 Divine Multiplier & Revive'
    }
  ];
}

// 1-hour cache to conserve credits and prevent duplicate queries
const triviaCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Initialize Google GenAI client if valid API key is present
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient = null;
if (apiKey && !apiKey.includes('your_') && apiKey.length > 10) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('✨ Gemini AI Client initialized for Celestial Dash');
  } catch (err) {
    console.warn('⚠️ GoogleGenAI initialization warning:', err.message);
  }
}

/**
 * Generates or retrieves Divine Gate Trivia for Celestial Dash
 * Strictly adheres to credit conservation, 1-hour caching, and failsafe fallback.
 */
export async function getDivineTrivia(difficulty = 'medium') {
  // If low difficulty, immediately serve from local curated vault (0 credit cost)
  if (difficulty === 'low' || !aiClient) {
    const randomTrivia = fallbackTrivia[Math.floor(Math.random() * fallbackTrivia.length)];
    return {
      ...randomTrivia,
      _status: 'local_vault',
      oracle_notice: 'The Oracle is resting in cosmic meditation. Ancient temple scrolls have unsealed.'
    };
  }

  // Check 1-minute bucketed cache key to prevent spam
  const cacheKey = `trivia_${difficulty}_${Math.floor(Date.now() / 60000)}`;
  const cached = triviaCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      _from_cache: true
    };
  }

  try {
    const prompt = `You are the Divine Oracle of Mount Kailash presiding over "Celestial Dash: Mooshak's Quest".
Generate an engaging, concise multiple-choice trivia question about Lord Ganesha, His vahana Mooshak, or Vedic mythological wisdom for a runner game revive checkpoint.
Difficulty: "${difficulty}".
Format response as a JSON object with this exact schema:
{
  "id": "gemini-${Date.now()}",
  "topic": "Theme title",
  "difficulty": "${difficulty}",
  "question": "Engaging mythological trivia question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "wisdom_explanation": "1-2 sentence profound explanation of the spiritual truth.",
  "divine_blessing": "+200 Score & Extra Life Granted",
  "source": "Kailash Oracle (Gemini 2.5 Flash)"
}
Ensure correct_index points to the correct option index (0, 1, 2, or 3). Return ONLY valid JSON.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '';
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const triviaData = JSON.parse(cleanedText);

    triviaCache.set(cacheKey, triviaData);
    return {
      ...triviaData,
      _status: 'live_ai',
      _from_cache: false
    };
  } catch (error) {
    console.error('AI API Limit Reached or Error. Falling back gracefully:', error?.message || error);
    const fallback = fallbackTrivia[Math.floor(Math.random() * fallbackTrivia.length)];
    return {
      ...fallback,
      _status: 'limit_reached',
      oracle_notice: 'The Oracle is resting in cosmic meditation. Please proceed with ancient temple scrolls.'
    };
  }
}

/**
 * Backward compatibility alias for existing riddle routes
 */
export async function getCelestialRiddle(topic = 'Wisdom', difficulty = 'medium') {
  return getDivineTrivia(difficulty);
}
