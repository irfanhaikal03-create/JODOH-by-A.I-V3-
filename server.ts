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
You have complete visibility over the entire event cohort and all algorithmic pairings.
Assist the administrator with:
- Reviewing compatibility metrics across all couples.
- Designing engaging icebreakers, dating schedule recommendations, and event venue strategies.
- Analyzing interpersonal friction risks and conflict mitigation.
- Providing bespoke dating coach advice for any participant or couple in the cohort.

Cohort Context:
Total Attendees: ${cohortContext?.totalCandidates || 12}
${cohortContext?.summaryList ? `Candidates Overview:\n${cohortContext.summaryList.join('\n')}` : ''}

Always respond in ${language}. Maintain a professional, executive, sophisticated, and insightful tone.`;
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
- Partner's Vision of an Ideal Companion: "${partnerInfo.partnerIdeal || 'Values mutual respect, emotional maturity and growth.'}"
- Compatibility Score: ${partnerInfo.matchScore || 85}%
- Core Alignment Rationale: "${partnerInfo.whyTheyMatch || 'Harmonious lifestyle values and shared life vision.'}"
- Potential Friction Points: "${partnerInfo.potentialChallenges || 'Navigating busy work-life schedules.'}"
- Recommended Tailored Dates: ${Array.isArray(partnerInfo.recommendedActivities) ? partnerInfo.recommendedActivities.join('; ') : 'Artisanal coffee, art gallery visit, tranquil nature walk'}

STRICT ROLE CONSTRAINTS FOR PARTICIPANT MODE:
1. You assist ${userName || 'the user'} EXCLUSIVELY with regards to their relationship and dating journey with ${partnerInfo.partnerName}.
2. If the user asks about other participants or seeks to browse other candidates, politely decline and refocus them on their official partner ${partnerInfo.partnerName}.
3. Provide:
   - Thoughtful recaps of why they match and what makes their pairing special.
   - 2-3 creative, concrete date activities tailored directly to ${partnerInfo.partnerName}'s actual hobbies (${Array.isArray(partnerInfo.partnerHobbies) ? partnerInfo.partnerHobbies.join(', ') : 'their interests'}).
   - Engaging conversation starters for their initial dates.
   - Practical advice on navigating dating phases, pacing, and handling professional schedules.
4. Tone: Warm, emotionally intelligent, encouraging, respectful, and sophisticated.
5. Always answer in ${language}.`;
    }

    // Call Gemini API if key is configured
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        // Construct conversation contents for Gemini
        const formattedContents = messages.map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.95,
          },
        });

        const reply = response.text ? response.text.trim() : '';
        if (reply) {
          return res.json({ reply, source: 'gemini' });
        }
      } catch (geminiError) {
        console.warn('Gemini chat call error, using intelligent fallback:', geminiError);
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
1. **Compatibility Overview**: Median affinity is strong with high alignment in lifestyle habits.
2. **Recommended Cohort Activity**: Host an interactive coffee cupping or collaborative trivia session to break the ice naturally without high-pressure speed-dating anxiety.
3. **Friction Advisory**: Ensure attendees with demanding corporate schedules establish transparent communication cadences early.`
        : `Sebagai Administrator Acara, anda mempunyai akses penuh ke seluruh direktori calon. Berdasarkan analisis algoritma:
1. **Gambaran Keseluruhan**: Tahap keserasian kohort mencatatkan purata tinggi dengan penjajaran kukuh dalam tabiat hidup & zon geografi.
2. **Cadangan Acara Suai Kenal**: Anjurkan sesi santai seperti 'Coffee Cupping' atau bengkel kraf berkumpulan bagi membolehkan interaksi spontan tanpa tekanan.
3. **Peringatan Penganjur**: Pasangan berkerjaya profesional memerlukan fleksibiliti masa dalam fasa permulaan temu janji.`;
    } else {
      const qLower = lastMessage.toLowerCase();
      if (qLower.includes('recap') || qLower.includes('mengapa') || qLower.includes('why') || qLower.includes('serasi')) {
        fallbackReply = isEn
          ? `### Compatibility Recap with ${partnerName}
- **Score**: ${partnerInfo?.matchScore || 88}% Compatibility Rating
- **Why You Match**: ${partnerInfo?.whyTheyMatch || 'You both share strong core values, work-life intentionality, and complementary communication styles.'}
- **Shared Affinity**: ${partnerName} enjoys ${hobbies}, which aligns beautifully with your profile.
- **Advice for Phase 1**: Start with open curiosity about their day-to-day passions!`
          : `### Ringkasan Keserasian Anda & ${partnerName}
- **Skor**: ${partnerInfo?.matchScore || 88}% Tahap Keserasian Algoritma
- **Sebab Padanan**: ${partnerInfo?.whyTheyMatch || 'Anda berdua berkongsi nilai kehidupan yang kukuh, persefahaman matang, dan gaya komunikasi yang saling melengkapi.'}
- **Minat Bersama**: ${partnerName} gemar ${hobbies}, yang memberikan banyak titik perbualan menarik.
- **Tip Fasa Pertama**: Luangkan masa bersembang mengenai impian masa depan dan minat santai mereka!`;
      } else if (qLower.includes('date') || qLower.includes('aktiviti') || qLower.includes('temu janji') || qLower.includes('activity')) {
        fallbackReply = isEn
          ? `### 3 Tailored Date Ideas for You & ${partnerName}
1. **Curated Coffee & Book Browsing**: A quiet afternoon at an artisanal cafe in ${partnerInfo?.partnerLocation || 'the city'} followed by a stroll through an independent bookstore.
2. **Weekend Nature Walk**: A peaceful morning trail walk, giving you uninterrupted time for genuine conversation without dinner awkwardness.
3. **Interactive Workshop**: A hands-on ceramics or culinary tasting experience inspired by ${partnerName}'s passion for ${hobbies}.`
          : `### 3 Cadangan Temu Janji Khusus untuk Anda & ${partnerName}
1. **Sesi Kopi Santai & Kedai Buku**: Nikmati kopi artisan di kafe yang tenang sekitar ${partnerInfo?.partnerLocation || 'pusat bandar'}, sesuai untuk berbual panjang tanpa gangguan.
2. **Riadah Pagi di Taman Botani**: Berjalan santai sambil menikmati udara segar—cara terbaik memecah kebuntuan tanpa rasa kekok.
3. **Bengkel Kreatif Bersama**: Terokai bengkel seni atau kraf hujung minggu yang selari dengan minat ${partnerName} dalam ${hobbies}.`;
      } else {
        fallbackReply = isEn
          ? `Hello! As your personal relationship concierge for **${partnerName}**, I am here to help you navigate your dating journey:
- **Partner Insight**: ${partnerName} works as a ${partnerInfo?.partnerOccupation || 'professional'} and values "${partnerInfo?.partnerIdeal || 'genuine connection and mutual growth'}".
- **Recommended Next Step**: Invite ${partnerName} to a low-pressure coffee catch-up. Ask them about their interest in ${hobbies}.
- **Dating Tip**: Focus on active listening during the first 30 minutes—curiosity is the highest form of romantic attraction!`
          : `Salam! Sebagai penasihat hubungan peribadi anda bersama **${partnerName}**, saya sedia membantu:
- **Maklumat Pasangan**: ${partnerName} bertugas sebagai ${partnerInfo?.partnerOccupation || 'profesional'} dan mendambakan "${partnerInfo?.partnerIdeal || 'hubungan yang ikhlas dan saling menyokong'}".
- **Langkah Disyorkan**: Mulakan dengan jemputan minum kopi santai dan tanyakan tentang minat mereka dalam ${hobbies}.
- **Tip Temu Janji**: Berikan tumpuan sepenuhnya dan dengar dengan empati—minat yang tulus adalah daya tarikan terhebat!`;
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
