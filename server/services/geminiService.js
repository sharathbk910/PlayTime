import { GoogleGenAI } from '@google/genai';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read local chronological fallback trivia
const localTriviaPath = path.resolve(__dirname, '../data/localTrivia.json');
let fallbackTrivia = [];
try {
  const fileData = fs.readFileSync(localTriviaPath, 'utf8');
  fallbackTrivia = JSON.parse(fileData);
} catch (err) {
  console.warn('Could not load local trivia file, using default array');
  fallbackTrivia = [];
}

// Fisher-Yates array shuffling to eliminate Option A bias
export function shuffleTriviaOptions(options, correctIndex) {
  if (!Array.isArray(options) || options.length === 0) {
    return { options: ['Yes', 'No', 'Maybe', 'Always'], correct_index: 0 };
  }

  const correctAnswer = options[correctIndex] ?? options[0];
  const shuffled = [...options];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const newCorrectIndex = shuffled.indexOf(correctAnswer);
  return {
    options: shuffled,
    correct_index: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
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

// Chronological lore chapters reference
const LORE_CHAPTER_TOPICS = [
  "Chapter 1: Parvati creates Ganesha from turmeric paste and sacred breath to guard her sanctum",
  "Chapter 2: Young Ganesha loyally stands guard at Mount Kailash and bars Lord Shiva",
  "Chapter 3: The battle at the entrance and Shiva's Trishula severing Ganesha's head",
  "Chapter 4: Shiva sends the Ganas Northward to find the head of the first living being",
  "Chapter 5: Rebirth as Gajanana with the noble elephant head",
  "Chapter 6: Coronation as Ganapati (Lord of Ganas) and Vighnaharta (Remover of Obstacles)",
  "Chapter 7: The Cosmic Race - Circling His parents Shiva and Parvati as the true universe",
  "Chapter 8: Taming Krauncha the giant demon mouse into his loyal vahana Mooshak",
  "Chapter 9: Breaking his own right tusk to pen the epic Mahabharata without pause for Sage Vyasa",
  "Chapter 10: The Sacred Modaka and the bliss of Self-Realization (Atma-Jnana)"
];

/**
 * Generates or retrieves Chronological Divine Gate Trivia for Celestial Dash
 * Follows Ganesha's life journey step-by-step with concise questions & randomized options.
 */
export async function getDivineTrivia(difficulty = 'medium', loreLevel = 1) {
  const normalizedLevel = Math.max(1, Math.min(10, Number(loreLevel) || 1));
  const chapterTopic = LORE_CHAPTER_TOPICS[normalizedLevel - 1] || LORE_CHAPTER_TOPICS[0];

  // Helper to pick and shuffle from curated local vault
  const getShuffledFallback = () => {
    const chapterItem = fallbackTrivia.find(t => t.lore_level === normalizedLevel) || fallbackTrivia[(normalizedLevel - 1) % fallbackTrivia.length] || fallbackTrivia[0];
    const { options, correct_index } = shuffleTriviaOptions(chapterItem.options, chapterItem.correct_index);
    return {
      ...chapterItem,
      options,
      correct_index,
      _status: 'local_vault'
    };
  };

  if (!aiClient || difficulty === 'low') {
    return getShuffledFallback();
  }

  // Check cache for this specific lore chapter
  const cacheKey = `lore_${normalizedLevel}_${difficulty}_${Math.floor(Date.now() / 120000)}`;
  const cached = triviaCache.get(cacheKey);
  if (cached) {
    // Re-shuffle cached options so it's fresh each time even from cache
    const { options, correct_index } = shuffleTriviaOptions(cached.options, cached.correct_index);
    return {
      ...cached,
      options,
      correct_index,
      _from_cache: true
    };
  }

  try {
    const prompt = `You are the Divine Oracle of Mount Kailash presiding over "Celestial Dash: Mooshak's Quest".
Generate a SHORT, engaging multiple-choice trivia question strictly about this chronological chapter of Lord Ganesha's life:
CHRONOLOGICAL TOPIC: "${chapterTopic}".
Level: ${normalizedLevel} of 10.

STRICT REQUIREMENTS:
1. Question must be very CONCISE (under 14 words).
2. All 4 options must be BRIEF (under 7 words each).
3. Provide 1 clearly correct option and 3 plausible Vedic alternatives.
4. Wisdom explanation must be 1 short sentence summarizing the lore truth.

Format response as a JSON object with this exact schema:
{
  "id": "gemini-lore-${normalizedLevel}-${Date.now()}",
  "lore_level": ${normalizedLevel},
  "chapter_title": "Chapter ${normalizedLevel}: Topic Name",
  "story_summary": "1 sentence lore summary",
  "question": "Short concise question?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correct_index": 0,
  "wisdom_explanation": "One short sentence explaining the spiritual truth.",
  "divine_blessing": "+200 Wisdom & Divine Shield",
  "source": "Vedic Puranic Lore"
}
Return ONLY valid JSON.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '';
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    // Randomize options order
    const { options, correct_index } = shuffleTriviaOptions(parsedData.options, parsedData.correct_index ?? 0);
    const finalData = {
      ...parsedData,
      lore_level: normalizedLevel,
      options,
      correct_index,
      _status: 'live_ai',
      _from_cache: false
    };

    triviaCache.set(cacheKey, parsedData);
    return finalData;
  } catch (error) {
    console.warn('AI API Error in chronological riddle, serving curated vault:', error?.message || error);
    return getShuffledFallback();
  }
}

/**
 * Backward compatibility alias for riddle routes
 */
export async function getCelestialRiddle(topic = 'Wisdom', difficulty = 'medium') {
  return getDivineTrivia(difficulty, 1);
}
