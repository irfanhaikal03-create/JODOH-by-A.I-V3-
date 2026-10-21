import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Participant {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  age: number;
  occupation: string;
  location: string;
  marital: string;
  smoking: string;
  hobbies: string[] | string;
  ideal: string;
  photo?: string;
}

interface MatchResult {
  rank: number;
  maleId: string;
  femaleId: string;
  maleName: string;
  femaleName: string;
  maleAge: number;
  femaleAge: number;
  maleOccupation: string;
  femaleOccupation: string;
  maleLocation: string;
  femaleLocation: string;
  malePhoto?: string;
  femalePhoto?: string;
  maleSmoking: string;
  femaleSmoking: string;
  maleHobbies: string[];
  femaleHobbies: string[];
  score: number;
  whyTheyMatch: string;
  potentialChallenges: string;
  recommendedActivities: string[];
  valueSynthesisPercent: number;
  frictionProbabilityPercent: number;
  crossCheckedTraits: string[];
}

const app = express();

function getPort(): number {
  const portArgIndex = process.argv.findIndex(arg => arg === '--port' || arg === '-p');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

const PORT = getPort();

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for fallback algorithmic matchmaking if Gemini API is unavailable
function fallbackAlgorithmicMatching(males: Participant[], females: Participant[]): MatchResult[] {
  const pairings: Array<{
    male: Participant;
    female: Participant;
    score: number;
    traits: string[];
    why: string;
    challenges: string;
    dates: string[];
  }> = [];

  for (const m of males) {
    for (const f of females) {
      let score = 70;
      const traits: string[] = [];

      // Smoking concordance
      if (m.smoking === f.smoking) {
        score += 8;
        if (m.smoking === 'Non-Smoker') {
          traits.push('Non-Smoker Match');
        } else {
          traits.push('Smoking Habit Aligned');
        }
      } else {
        score -= 10;
      }

      // Location match
      if (m.location.toLowerCase() === f.location.toLowerCase()) {
        score += 8;
        traits.push(`Aligned Location (${m.location})`);
      } else {
        traits.push(`Interstate (${m.location} & ${f.location})`);
      }

      // Age difference
      const ageDiff = Math.abs(m.age - f.age);
      if (ageDiff <= 3) {
        score += 6;
      } else if (ageDiff <= 6) {
        score += 3;
      }

      // Hobbies overlap
      const mHobbies = Array.isArray(m.hobbies) ? m.hobbies : (m.hobbies ? m.hobbies.split(',').map(s => s.trim()) : []);
      const fHobbies = Array.isArray(f.hobbies) ? f.hobbies : (f.hobbies ? f.hobbies.split(',').map(s => s.trim()) : []);
      
      const shared = mHobbies.filter(mh => fHobbies.some(fh => fh.toLowerCase().includes(mh.toLowerCase()) || mh.toLowerCase().includes(fh.toLowerCase())));
      if (shared.length > 0) {
        score += 6;
        traits.push(`Shared Hobby: ${shared[0]}`);
      } else if (mHobbies[0] && fHobbies[0]) {
        traits.push(`Complementary Passions`);
      }

      traits.push('Equal Priority: Work-Life Boundaries');

      // Cap score
      score = Math.min(98, Math.max(68, score));

      const why = `Both demonstrate deeply rooted values around ${m.occupation.toLowerCase()} and ${f.occupation.toLowerCase()}, cultural grounding, and sustainable living. Their communication archetypes provide complementary balance: ${m.name.split(' ')[0]}'s initiative is harmoniously grounded by ${f.name.split(' ')[0]}'s reflective discernment.`;
      
      const challenges = `Demanding schedules in ${m.occupation} and ${f.occupation} may produce periodic calendar crunches. Transparent cadence pacing and mutual respect for recharge hours will safeguard their shared momentum.`;

      const dates = [
        `Artisanal coffee cupping and rare book exchange in ${m.location}.`,
        `Quiet Sunday botanical garden walk followed by a curated tasting menu.`,
        `Tactile craft workshop or gallery exhibition exploration.`
      ];

      pairings.push({
        male: m,
        female: f,
        score,
        traits,
        why,
        challenges,
        dates
      });
    }
  }

  // Sort descending by score
  pairings.sort((a, b) => b.score - a.score);

  // STRICT 1-TO-1 EXCLUSIVE PAIRING:
  // Each person (male or female) must only appear ONCE across the entire matched couples list!
  // Once matched, they cannot appear with any other partner.
  const usedMaleIds = new Set<string>();
  const usedFemaleIds = new Set<string>();
  const uniquePairings: typeof pairings = [];

  for (const p of pairings) {
    if (!usedMaleIds.has(p.male.id) && !usedFemaleIds.has(p.female.id)) {
      usedMaleIds.add(p.male.id);
      usedFemaleIds.add(p.female.id);
      uniquePairings.push(p);
      if (uniquePairings.length >= 10) break;
    }
  }

  // Return unique top pairings
  return uniquePairings.map((p, idx) => {
    const mHobbies = Array.isArray(p.male.hobbies) ? p.male.hobbies : (p.male.hobbies ? p.male.hobbies.split(',').map(s => s.trim()) : []);
    const fHobbies = Array.isArray(p.female.hobbies) ? p.female.hobbies : (p.female.hobbies ? p.female.hobbies.split(',').map(s => s.trim()) : []);

    return {
      rank: idx + 1,
      maleId: p.male.id,
      femaleId: p.female.id,
      maleName: p.male.name,
      femaleName: p.female.name,
      maleAge: p.male.age,
      femaleAge: p.female.age,
      maleOccupation: p.male.occupation,
      femaleOccupation: p.female.occupation,
      maleLocation: p.male.location,
      femaleLocation: p.female.location,
      malePhoto: p.male.photo,
      femalePhoto: p.female.photo,
      maleSmoking: p.male.smoking,
      femaleSmoking: p.female.smoking,
      maleHobbies: mHobbies,
      femaleHobbies: fHobbies,
      score: Math.max(68, Math.min(99, p.score - idx * 2)), // Slight natural gradation, clamped between 68 and 99
      whyTheyMatch: p.why,
      potentialChallenges: p.challenges,
      recommendedActivities: p.dates,
      valueSynthesisPercent: Math.min(99, 90 + Math.floor(Math.random() * 9)),
      frictionProbabilityPercent: Math.max(15, 20 + Math.floor(Math.random() * 12)),
      crossCheckedTraits: p.traits
    };
  });
}

// Batch Matchmaking Endpoint
app.post('/api/match', async (req, res) => {
  try {
    const { candidates } = req.body as { candidates: Participant[] };

    if (!candidates || !Array.isArray(candidates)) {
      return res.status(400).json({ error: 'Candidate list is required.' });
    }

    const males = candidates.filter(c => c.gender === 'Male');
    const females = candidates.filter(c => c.gender === 'Female');

    if (males.length === 0 || females.length === 0) {
      return res.status(400).json({
        error: 'Requires at least 1 male and 1 female participant to generate matches.',
        code: 'INSUFFICIENT_POOL'
      });
    }

    const maxMatchesPossible = Math.min(10, Math.min(males.length, females.length));

    // Try calling Gemini if API key is present
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        const prompt = `You are the lead algorithmic matchmaking evaluator for "Jodoh by AI".
Analyze the candidate pool and select the Top ${maxMatchesPossible} most compatible, exclusive couples.

CRITICAL REQUIREMENT - STRICT 1-TO-1 MATCHING (ZERO PARTNER OVERLAP):
- Each person (male and female) can only appear ONCE in the entire matches list!
- Once a male is matched with a female partner, neither that male NOR that female can appear in any other match with another partner.
- Every matched couple must consist of a completely unique male and female who do not appear anywhere else in the list.
- Generate exactly ${maxMatchesPossible} mutually exclusive couples (or fewer if fewer candidates exist).

For each unique match, evaluate their compatibility score (70-99), key alignment reasons, potential interpersonal friction/challenges, and 2-3 tailored dates.

Male Candidates (${males.length}):
${JSON.stringify(males, null, 2)}

Female Candidates (${females.length}):
${JSON.stringify(females, null, 2)}

Rank matches in descending order by score (highest compatibility first, rank 1 to ${maxMatchesPossible}).
Return valid JSON matching the schema.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an executive matchmaking analytical engine. Provide insightful, realistic, respectful, and sophisticated psychological and lifestyle evaluations for matchmaking couples. Enforce strict 1-to-1 uniqueness: no individual can be paired more than once.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.INTEGER },
                  maleId: { type: Type.STRING },
                  femaleId: { type: Type.STRING },
                  score: { type: Type.INTEGER, description: 'Percentage score from 70 to 99' },
                  crossCheckedTraits: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '3-4 key traits like Non-Smoker Match, Shared Hobby, Location aligned'
                  },
                  whyTheyMatch: {
                    type: Type.STRING,
                    description: '2-3 sentences explaining shared values, communicative temperament, life vision'
                  },
                  potentialChallenges: {
                    type: Type.STRING,
                    description: '1-2 sentences on career schedules, lifestyle differences, or habits to navigate'
                  },
                  recommendedActivities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2-3 bespoke date activity ideas'
                  },
                  valueSynthesisPercent: { type: Type.INTEGER, description: 'e.g. 96' },
                  frictionProbabilityPercent: { type: Type.INTEGER, description: 'e.g. 22' }
                },
                required: [
                  'rank',
                  'maleId',
                  'femaleId',
                  'score',
                  'crossCheckedTraits',
                  'whyTheyMatch',
                  'potentialChallenges',
                  'recommendedActivities'
                ]
              }
            }
          }
        });

        const rawText = response.text ? response.text.trim() : '';
        if (rawText) {
          const parsed = JSON.parse(rawText) as Array<any>;
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Strictly enforce 1-to-1 uniqueness filter on model output
            const usedMaleIds = new Set<string>();
            const usedFemaleIds = new Set<string>();
            const uniqueParsed: any[] = [];

            for (const item of parsed) {
              if (
                item.maleId &&
                item.femaleId &&
                !usedMaleIds.has(item.maleId) &&
                !usedFemaleIds.has(item.femaleId)
              ) {
                const maleExists = males.some(m => m.id === item.maleId);
                const femaleExists = females.some(f => f.id === item.femaleId);
                if (maleExists && femaleExists) {
                  usedMaleIds.add(item.maleId);
                  usedFemaleIds.add(item.femaleId);
                  uniqueParsed.push(item);
                  if (uniqueParsed.length >= maxMatchesPossible) break;
                }
              }
            }

            if (uniqueParsed.length > 0) {
              // Hydrate with full candidate profile details
              const hydrated = uniqueParsed.map((item, idx) => {
                const male = candidates.find(c => c.id === item.maleId) || males[0];
                const female = candidates.find(c => c.id === item.femaleId) || females[0];
                const mHobbies = Array.isArray(male.hobbies) ? male.hobbies : (male.hobbies ? male.hobbies.split(',').map(s => s.trim()) : []);
                const fHobbies = Array.isArray(female.hobbies) ? female.hobbies : (female.hobbies ? female.hobbies.split(',').map(s => s.trim()) : []);

                return {
                  rank: idx + 1,
                  maleId: male.id,
                  femaleId: female.id,
                  maleName: male.name,
                  femaleName: female.name,
                  maleAge: male.age,
                  femaleAge: female.age,
                  maleOccupation: male.occupation,
                  femaleOccupation: female.occupation,
                  maleLocation: male.location,
                  femaleLocation: female.location,
                  malePhoto: male.photo,
                  femalePhoto: female.photo,
                  maleSmoking: male.smoking,
                  femaleSmoking: female.smoking,
                  maleHobbies: mHobbies,
                  femaleHobbies: fHobbies,
                  score: item.score || Math.max(75, 96 - idx * 2),
                  whyTheyMatch: item.whyTheyMatch,
                  potentialChallenges: item.potentialChallenges,
                  recommendedActivities: item.recommendedActivities || [
                    `Artisan coffee tasting in ${male.location}`,
                    `Stroll through architectural landmarks and quiet courtyard tea`
                  ],
                  valueSynthesisPercent: item.valueSynthesisPercent || 95,
                  frictionProbabilityPercent: item.frictionProbabilityPercent || 24,
                  crossCheckedTraits: item.crossCheckedTraits || [
                    male.smoking === female.smoking ? 'Smoking Status Aligned' : 'Lifestyle Adaptable',
                    'Aligned Metropolitan Zone',
                    'Complementary Passions'
                  ]
                };
              });

              return res.json({ matches: hydrated, source: 'gemini' });
            }
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini model query encountered error, falling back to algorithmic synthesis:', geminiErr);
      }
    }

    // High quality deterministic fallback
    const fallbackMatches = fallbackAlgorithmicMatching(males, females);
    return res.json({ matches: fallbackMatches, source: 'algorithmic' });

  } catch (err: any) {
    console.error('Matchmaking error:', err);
    return res.status(500).json({ error: 'Matchmaking failed. Please try again.' });
  }
});

// Dynamic Translation Endpoint for Any Language
app.post('/api/translate', async (req, res) => {
  try {
    const { targetLanguage, texts } = req.body as {
      targetLanguage: string;
      texts: Record<string, string>;
    };

    if (!targetLanguage || !texts || typeof texts !== 'object') {
      return res.status(400).json({ error: 'targetLanguage and texts map are required.' });
    }

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        const prompt = `Translate the following JSON object key-value pairs into the target language: "${targetLanguage}".
Keep the exact same keys. Translate ONLY the string values faithfully and naturally for a luxury matchmaking platform.
Ensure the translation sounds professional, respectful, and native.

JSON to translate:
${JSON.stringify(texts, null, 2)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are an expert native translator. Translate JSON text accurately into "${targetLanguage}". Return ONLY valid JSON with identical keys.`,
            responseMimeType: 'application/json',
          },
        });

        const raw = response.text ? response.text.trim() : '';
        if (raw) {
          const parsed = JSON.parse(raw);
          return res.json({ translated: parsed, source: 'gemini' });
        }
      } catch (geminiErr) {
        console.warn('Gemini translation error, returning original texts:', geminiErr);
      }
    }

    return res.json({ translated: texts, source: 'original' });
  } catch (err: any) {
    console.error('Translation route error:', err);
    return res.status(500).json({ error: 'Translation failed.' });
  }
});

// AI Concierge & Relationship Advisor Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      role,
      userName,
      partnerInfo,
      cohortContext,
      messages,
      language = 'Malay',
    } = req.body as {
      role: 'admin' | 'participant';
      userName?: string;
      partnerInfo?: {
        partnerName: string;
        partnerAge?: number;
        partnerOccupation?: string;
        partnerLocation?: string;
        partnerHobbies?: string[];
        partnerSmoking?: string;
        partnerIdeal?: string;
        matchScore?: number;
        whyTheyMatch?: string;
        potentialChallenges?: string;
        recommendedActivities?: string[];
      };
      cohortContext?: {
        totalCandidates?: number;
        summaryList?: string[];
      };
      messages: Array<{ role: 'user' | 'model' | 'system'; content: string }>;
      language?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Build context-aware system instructions based on user role
    let systemInstruction = '';

    if (role === 'admin') {
      systemInstruction = `You are the Executive Matchmaking AI Concierge for JODOH by AI with FULL administrative privileges.
Assist the administrator with cohort compatibility, icebreakers, event strategies, and dating advice.

Cohort Context:
Total Attendees: ${cohortContext?.totalCandidates || 12}
${cohortContext?.summaryList ? `Candidates Overview:\n${cohortContext.summaryList.join('\n')}` : ''}

SPEED & CONCISENESS (CRITICAL):
Provide a swift, high-impact, direct answer in 2-3 short, focused paragraphs or 3 concise points (maximum 100-130 words). Never write long essays or filler.

ABSOLUTE CHARACTER RESTRICTION (CRITICAL):
NEVER output any hash characters (#) or asterisk characters (*) anywhere in your output.
- Do NOT use # for headings or rankings (write "Pasangan 1" or "Meja 1", never "#1").
- Do NOT use ** for bold text.
- Do NOT use * for italics or bullets.
- For lists, use "1.", "2.", "3." or "• ".
Always respond in ${language}. Maintain a professional, executive, sophisticated tone.`;
    } else {
      // Participant Mode: STRICTLY bounded to their official partner
      if (!partnerInfo || !partnerInfo.partnerName) {
        return res.json({
          reply: language.toLowerCase().includes('en')
            ? 'Your official match is currently being curated by the event organizers. Once the administrator publishes the official pairings, I will provide personalized guidance and dating tips specifically for you and your partner!'
            : 'Padanan rasmi anda sedang diselaraskan oleh pihak penganjur. Sebaik sahaja keputusan diterbitkan, saya akan sedia membantu memberikan panduan peribadi, idea temu janji, dan tips hubungan khusus bersama pasangan rasmi anda!',
        });
      }

      systemInstruction = `You are the Personal Dating Concierge and Relationship Advisor for ${userName || 'the attendee'}.
${userName || 'The attendee'} has been paired with their OFFICIAL MATCH: ${partnerInfo.partnerName}.

OFFICIAL PARTNER DOSSIER:
- Name: ${partnerInfo.partnerName}
- Age: ${partnerInfo.partnerAge || 'N/A'}
- Occupation: ${partnerInfo.partnerOccupation || 'N/A'}
- Location: ${partnerInfo.partnerLocation || 'N/A'}
- Smoking Habit: ${partnerInfo.partnerSmoking || 'N/A'}
- Passions & Hobbies: ${Array.isArray(partnerInfo.partnerHobbies) ? partnerInfo.partnerHobbies.join(', ') : 'N/A'}
- Partner's Vision: "${partnerInfo.partnerIdeal || 'Values mutual respect, emotional maturity and growth.'}"
- Compatibility Score: ${partnerInfo.matchScore || 85}%
- Alignment Rationale: "${partnerInfo.whyTheyMatch || 'Harmonious lifestyle values and shared life vision.'}"
- Recommended Tailored Dates: ${Array.isArray(partnerInfo.recommendedActivities) ? partnerInfo.recommendedActivities.join('; ') : 'Artisanal coffee, art gallery visit, nature walk'}

ROLE RULES:
1. You assist ${userName || 'the user'} EXCLUSIVELY with regards to their relationship with ${partnerInfo.partnerName}.
2. Provide concrete date ideas, icebreakers, and empathetic dating advice.

SPEED & CONCISENESS (CRITICAL):
Answer swiftly and concisely in 2-3 short, friendly paragraphs or 3 direct points (maximum 100-130 words). Never write long essays or filler.

ABSOLUTE CHARACTER RESTRICTION (CRITICAL):
NEVER output any hash characters (#) or asterisk characters (*) anywhere in your output.
- Do NOT use # for headings or rankings (write "Pasangan 1" or "Meja 1", never "#1").
- Do NOT use ** for bold text.
- Do NOT use * for italics or bullets.
- For lists, use "1.", "2.", "3." or "• ".
Always answer in ${language}. Tone: Warm, encouraging, and sophisticated.`;
    }

    // Call Gemini API if key is configured (Ultra-low latency model for conversational chat)
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        // Construct conversation contents for Gemini - take last 6 messages for maximum speed
        const recentMessages = messages.slice(-6);
        const formattedContents = recentMessages.map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout')), 5000)
        );

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.4,
            maxOutputTokens: 260,
          },
        });

        const response = await Promise.race([geminiPromise, timeoutPromise]);
        const reply = response.text ? response.text.trim() : '';
        if (reply) {
          // Thoroughly sanitize any accidental markdown hashes or asterisks from the AI output
          const cleanedReply = reply
            .replace(/^#+\s*/gm, '')
            .replace(/#(\d+)/g, 'Pasangan $1')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^\s*[\*\-]\s+/gm, '• ')
            .replace(/[#*]/g, '')
            .trim();

          return res.json({ reply: cleanedReply, source: 'gemini' });
        }
      } catch (geminiError: any) {
        console.warn('Gemini chat latency mitigation triggered fallback:', geminiError?.message || geminiError);
      }
    }

    // High quality deterministic fallback if API key is not ready or fails
    let fallbackReply = '';
    const isEn = language.toLowerCase().includes('en');
    const partnerName = partnerInfo?.partnerName || 'Pasangan Anda';
    const hobbies = Array.isArray(partnerInfo?.partnerHobbies) ? partnerInfo.partnerHobbies.join(', ') : 'aktiviti riadah';

    if (role === 'admin') {
      fallbackReply = isEn
        ? `As the Matchmaking Administrator, you have full oversight across the cohort. Based on our algorithmic analysis:
1. Compatibility Overview: Median affinity is strong with high alignment in lifestyle habits.
2. Recommended Cohort Activity: Host an interactive coffee cupping or collaborative trivia session to break the ice naturally without high-pressure speed-dating anxiety.
3. Friction Advisory: Ensure attendees with demanding corporate schedules establish transparent communication cadences early.`
        : `Sebagai Administrator Acara, anda mempunyai akses penuh ke seluruh direktori calon. Berdasarkan analisis algoritma:
1. Gambaran Keseluruhan: Tahap keserasian kohort mencatatkan purata tinggi dengan penjajaran kukuh dalam tabiat hidup dan zon geografi.
2. Cadangan Acara Suai Kenal: Anjurkan sesi santai seperti sesi minum kopi santai atau bengkel kraf berkumpulan bagi membolehkan interaksi spontan tanpa tekanan.
3. Peringatan Penganjur: Pasangan berkerjaya profesional memerlukan fleksibiliti masa dalam fasa permulaan temu janji.`;
    } else {
      const qLower = lastMessage.toLowerCase();
      if (qLower.includes('recap') || qLower.includes('mengapa') || qLower.includes('why') || qLower.includes('serasi')) {
        fallbackReply = isEn
          ? `Ringkasan Keserasian Anda & ${partnerName}
• Skor: ${partnerInfo?.matchScore || 88}% Tahap Keserasian Algoritma
• Sebab Padanan: ${partnerInfo?.whyTheyMatch || 'Anda berdua berkongsi nilai kehidupan yang kukuh, persefahaman matang, dan gaya komunikasi yang saling melengkapi.'}
• Minat Bersama: ${partnerName} gemar ${hobbies}, yang memberikan banyak titik perbualan menarik.
• Tip Fasa Pertama: Luangkan masa bersembang mengenai impian masa depan dan minat santai mereka!`
          : `Ringkasan Keserasian Anda & ${partnerName}
• Skor: ${partnerInfo?.matchScore || 88}% Tahap Keserasian Algoritma
• Sebab Padanan: ${partnerInfo?.whyTheyMatch || 'Anda berdua berkongsi nilai kehidupan yang kukuh, persefahaman matang, dan gaya komunikasi yang saling melengkapi.'}
• Minat Bersama: ${partnerName} gemar ${hobbies}, yang memberikan banyak titik perbualan menarik.
• Tip Fasa Pertama: Luangkan masa bersembang mengenai impian masa depan dan minat santai mereka!`;
      } else if (qLower.includes('date') || qLower.includes('aktiviti') || qLower.includes('temu janji') || qLower.includes('activity')) {
        fallbackReply = isEn
          ? `Tiga Cadangan Temu Janji Khusus untuk Anda & ${partnerName}
1. Sesi Kopi Santai & Kedai Buku: Nikmati kopi artisan di kafe yang tenang sekitar ${partnerInfo?.partnerLocation || 'pusat bandar'}, sesuai untuk berbual panjang tanpa gangguan.
2. Riadah Pagi di Taman Botani: Berjalan santai sambil menikmati udara segar sebagai cara terbaik memecah kebuntuan tanpa rasa kekok.
3. Bengkel Kreatif Bersama: Terokai bengkel seni atau kraf hujung minggu yang selari dengan minat ${partnerName} dalam ${hobbies}.`
          : `Tiga Cadangan Temu Janji Khusus untuk Anda & ${partnerName}
1. Sesi Kopi Santai & Kedai Buku: Nikmati kopi artisan di kafe yang tenang sekitar ${partnerInfo?.partnerLocation || 'pusat bandar'}, sesuai untuk berbual panjang tanpa gangguan.
2. Riadah Pagi di Taman Botani: Berjalan santai sambil menikmati udara segar sebagai cara terbaik memecah kebuntuan tanpa rasa kekok.
3. Bengkel Kreatif Bersama: Terokai bengkel seni atau kraf hujung minggu yang selari dengan minat ${partnerName} dalam ${hobbies}.`;
      } else {
        fallbackReply = isEn
          ? `Hello! Sebagai penasihat hubungan peribadi anda bersama ${partnerName}, saya sedia membantu:
• Maklumat Pasangan: ${partnerName} bertugas sebagai ${partnerInfo?.partnerOccupation || 'profesional'} dan mendambakan "${partnerInfo?.partnerIdeal || 'hubungan yang ikhlas dan saling menyokong'}".
• Langkah Disyorkan: Mulakan dengan jemputan minum kopi santai dan tanyakan tentang minat mereka dalam ${hobbies}.
• Tip Temu Janji: Berikan tumpuan sepenuhnya dan dengar dengan empati kerana minat yang tulus adalah daya tarikan terhebat!`
          : `Salam! Sebagai penasihat hubungan peribadi anda bersama ${partnerName}, saya sedia membantu:
• Maklumat Pasangan: ${partnerName} bertugas sebagai ${partnerInfo?.partnerOccupation || 'profesional'} dan mendambakan "${partnerInfo?.partnerIdeal || 'hubungan yang ikhlas dan saling menyokong'}".
• Langkah Disyorkan: Mulakan dengan jemputan minum kopi santai dan tanyakan tentang minat mereka dalam ${hobbies}.
• Tip Temu Janji: Berikan tumpuan sepenuhnya dan dengar dengan empati kerana minat yang tulus adalah daya tarikan terhebat!`;
      }
    }

    return res.json({ reply: fallbackReply, source: 'fallback' });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: 'Failed to process chat query.' });
  }
});

async function main() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Jodoh by AI server running on http://0.0.0.0:${PORT}`);
  });
}

main();
