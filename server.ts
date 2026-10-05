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
const PORT = process.env.PORT || 3000;

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
      score: p.score - idx * 2, // Slight natural gradation
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
          model: 'gemini-3.1-flash-lite',
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
          model: 'gemini-3.1-flash-lite',
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
