import { GoogleGenAI } from '@google/genai';
import NodeCache from 'node-cache';

const chatCache = new NodeCache({ stdTTL: 1800, checkperiod: 60 });

const SYSTEM_INSTRUCTION = `You are the Sage AI, the divine, friendly, and knowledgeable mythological game guide for "ModhakVerse: The Epic Journey of Ganpati".

Here is your complete sacred knowledge about the game:
1. **Core Story & Lore:**
   - The player runs through celestial realms and cosmic highways to collect sweet golden Modaks.
   - Players answer divine trivia questions to unlock and master the epic 10-chapter journey of Lord Ganpati.
2. **Controls:**
   - **Move Left:** Left Arrow or 'A' key or Swipe Left or tap Left screen button.
   - **Move Right:** Right Arrow or 'D' key or Swipe Right or tap Right screen button.
   - **Jump:** Up Arrow or 'W' or Spacebar or Swipe Up or tap JUMP button.
   - **Slide:** Down Arrow or 'S' or Swipe Down or tap SLIDE button.
3. **Obstacles & How to Avoid Them:**
   - **Rolling Pillars / Spiked Logs:** Low obstacle. Must JUMP over!
   - **Sacred Fire Pits:** Low obstacle. Must JUMP over!
   - **Floating Demon Toranas / Archways:** High obstacle. Must SLIDE underneath!
   - **Asura Demon Spirits:** Full-lane obstacle. Must SWITCH LANES to dodge!
4. **Fouls & The Divine Gate Revive:**
   - If Mooshak touches an obstacle without evading, a FOUL is incurred.
   - The game pauses at the Divine Gate, where the Kailash Oracle poses a mythological trivia riddle about Lord Ganesha and Vedic wisdom.
   - Answering correctly clears the foul, grants an Extra Life, awards bonus points, and gives Mooshak 3 seconds of golden invulnerability shield!
5. **Trial vs Authorized Play:**
   - New visitors/guests get 1 Free Trial Dash.
   - To continue playing, save scores, earn achievements, and climb the live contest leaderboard, players must Sign In (Google or Email).
6. **Multiplayer & Ghost Racing:**
   - Concurrent players running in the cosmos appear as translucent ghost avatars with live distance tracking powered by Supabase Realtime WebSockets.
7. **Anti-Cheat:**
   - Scores are cryptographically signed and verified on the server against physical speed limits and item density to ensure fair contest rankings.

Tone: Warm, wise, encouraging, with mythological flair and emojis (🪷, 🐭, 🥮, ✨, 🕉️). Keep answers concise (2-4 sentences or clear bullet points) so players can quickly get back to running!`;

const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient = null;
if (apiKey && !apiKey.includes('your_') && apiKey.length > 10) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('✨ Kailash Sage Chatbot: Gemini AI connected');
  } catch (err) {
    console.warn('Chatbot Gemini init notice:', err.message);
  }
}

// Fallback rulebook responses if offline or rate limited
const FAQ_RESPONSES = [
  {
    keywords: ['control', 'play', 'how to', 'arrow', 'key', 'wasd'],
    answer: '🐭 **Controls Guide:**\n• **A / ⬅️**: Dash Left\n• **D / ➡️**: Dash Right\n• **W / ⬆️ / Space**: Jump over rolling pillars & fire pits\n• **S / ⬇️**: Slide flat under high demon arches\n• Mobile users can swipe or use the on-screen gold buttons!'
  },
  {
    keywords: ['obstacle', 'foul', 'hit', 'die', 'pillar', 'fire', 'arch', 'demon'],
    answer: '⚡ **Evading Obstacles & Fouls:**\n• **Rolling Pillars & Fire Pits** are low: **JUMP** over them!\n• **Floating Demon Arches** are high: **SLIDE** underneath!\n• **Asura Spirits** block an entire lane: **SWITCH LANES** to evade!\nIf you hit an obstacle, a foul occurs—answer the Oracle\'s riddle to clear the foul and revive with 3s invulnerability!'
  },
  {
    keywords: ['riddle', 'trivia', 'divine gate', 'revive', 'life', 'extra life'],
    answer: '🪷 **The Divine Gate:**\nWhen a foul happens, the Kailash Oracle presents a sacred Vedic riddle. Answering correctly grants an **Extra Life**, clears the foul, boosts your score multiplier, and activates a golden invulnerability shield!'
  },
  {
    keywords: ['modak', 'score', 'point', 'multiplier'],
    answer: '🥮 **Modaks & Scoring:**\nEvery Modak gathered awards +75 points! Distance dashed awards +10 points per meter. Clearing Divine Gate riddles increases your Divine Multiplier ($1\\times, 2\\times, 3\\times$), multiplying your Modak earnings exponentially!'
  },
  {
    keywords: ['login', 'free', 'trial', 'account', 'sign in', 'auth'],
    answer: '🕉️ **Pilgrimage Authorization:**\nFirst-time seekers enjoy **1 Free Trial Dash**! To continue your pilgrimage, record permanent high scores, and contest for the top of the leaderboard, simply Sign In with Google or Email.'
  },
  {
    keywords: ['story', 'who is', 'mooshak', 'ganesha', 'lore', 'mouse'],
    answer: '✨ **The Lore of Mooshak:**\nMooshak is Lord Ganesha\'s devoted vahana (divine mount). The humble mouse symbolizes restless worldly desires, tamed and elevated into righteousness by Ganesha\'s supreme intellect and wisdom!'
  }
];

export async function askKailashSage(userMessage) {
  const query = (userMessage || '').trim();
  if (!query) {
    return 'Greetings, seeker! How may the Kailash Oracle guide your celestial sprint today? 🪷';
  }

  // Check cache for common repeated queries
  const cacheKey = `chat_${query.toLowerCase()}`;
  const cached = chatCache.get(cacheKey);
  if (cached) return cached;

  // Try live Gemini API if configured
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 300,
          temperature: 0.7
        }
      });

      const reply = response.text?.trim();
      if (reply) {
        chatCache.set(cacheKey, reply);
        return reply;
      }
    } catch (err) {
      console.warn('Gemini chat error, using sacred rulebook fallback:', err?.message || err);
    }
  }

  // Offline / Fallback FAQ matching
  const lower = query.toLowerCase();
  for (const faq of FAQ_RESPONSES) {
    if (faq.keywords.some(k => lower.includes(k))) {
      return faq.answer;
    }
  }

  return 'Blessings on your journey, seeker! 🪷 Use Arrow keys or WASD to navigate Mooshak across the 3 celestial lanes, jump over rolling pillars, slide under demon arches, and collect golden Modaks for Lord Ganesha. Sign in to record your name on the eternal leaderboard! ✨';
}
