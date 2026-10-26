import { Participant, MatchResult } from '../types';

/**
 * Deterministic client-side matching engine enforcing strict 1-to-1 exclusivity.
 * Used as an instant fallback or offline generator when network or Gemini API is slow.
 */
export function generateClientMatches(participants: Participant[]): MatchResult[] {
  const males = participants.filter(p => p.gender === 'Male');
  const females = participants.filter(p => p.gender === 'Female');

  if (males.length === 0 || females.length === 0) {
    return [];
  }

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
      let score = 72;
      const traits: string[] = [];

      // 1. Smoking Habit Concordance
      if (m.smoking === f.smoking) {
        score += 8;
        if (m.smoking === 'Non-Smoker') {
          traits.push('Bukan Perokok (Harmoni)');
        } else {
          traits.push('Tabiat Merokok Selari');
        }
      } else {
        score -= 10;
        traits.push('Perbezaan Tabiat Merokok');
      }

      // 2. Geographic Proximity
      const mLoc = (m.location || '').toLowerCase();
      const fLoc = (f.location || '').toLowerCase();
      if (mLoc.includes(fLoc) || fLoc.includes(mLoc) || (mLoc.includes('kuala lumpur') && fLoc.includes('selangor')) || (mLoc.includes('selangor') && fLoc.includes('kuala lumpur'))) {
        score += 8;
        traits.push(`Lokasi Berdekatan (${m.location} & ${f.location})`);
      } else {
        traits.push(`Jarak Antara Negeri (${m.location} - ${f.location})`);
      }

      // 3. Age Proximity
      const ageDiff = Math.abs(m.age - f.age);
      if (ageDiff <= 3) {
        score += 6;
        traits.push('Lingkungan Umur Sangat Serasi');
      } else if (ageDiff <= 6) {
        score += 3;
        traits.push('Jurang Umur Seimbang');
      }

      // 4. Hobbies & Interest Overlap
      const mHobbies = Array.isArray(m.hobbies) ? m.hobbies : (m.hobbies ? m.hobbies.split(',').map(s => s.trim()) : []);
      const fHobbies = Array.isArray(f.hobbies) ? f.hobbies : (f.hobbies ? f.hobbies.split(',').map(s => s.trim()) : []);

      const shared = mHobbies.filter(mh =>
        fHobbies.some(fh => fh.toLowerCase().includes(mh.toLowerCase()) || mh.toLowerCase().includes(fh.toLowerCase()))
      );

      if (shared.length > 0) {
        score += 6;
        traits.push(`Minat Bersama: ${shared[0]}`);
      } else {
        traits.push('Minat & Riadah Saling Melengkapi');
      }

      traits.push('Keseimbangan Kerjaya & Nilai Rumahtangga');

      // 5. Core Values Quiz Concordance
      if (m.valuesAnswers && f.valuesAnswers) {
        let matchingDimensions = 0;
        const keys = ['finance', 'conflict', 'career', 'living', 'lifestyle', 'roles'] as const;
        keys.forEach(k => {
          if (m.valuesAnswers![k] && f.valuesAnswers![k] && m.valuesAnswers![k] === f.valuesAnswers![k]) {
            matchingDimensions++;
          }
        });
        if (matchingDimensions >= 4) {
          score += 5;
          traits.push(`Keserasian Nilai Teras ${Math.round((matchingDimensions / 6) * 100)}%`);
        } else if (matchingDimensions <= 1) {
          score -= 3;
          traits.push('Perbezaan Arketaip Nilai');
        }
      } else if (m.valuesArchetype && f.valuesArchetype && m.valuesArchetype === f.valuesArchetype) {
        score += 4;
        traits.push(`Arketaip Sepadan: ${m.valuesArchetype}`);
      }

      // Score bounds
      score = Math.min(98, Math.max(70, score));

      const mFirstName = m.name.split(' ')[0];
      const fFirstName = f.name.split(' ')[0];

      const why = `Kedua-dua calon menunjukkan asas nilai yang kukuh merangkumi komitmen kerjaya (${m.occupation} & ${f.occupation}), kestabilan emosi dan kesediaan melangkah ke alam rumahtangga. Personaliti ${mFirstName} yang berpandangan jauh serasi dengan ketenangan dan kebijaksanaan ${fFirstName}.`;

      const challenges = `Kesibukan jadual kerja profesional dalam bidang ${m.occupation} dan ${f.occupation} mungkin memerlukan komunikasi awal mengenai pengurusan masa dan pembahagian komitmen keluarga.`;

      const dates = [
        `Sesi santai teh petang di kafe tenang sekitar ${m.location} untuk perbualan ta'aruf pertama.`,
        `Riadah pagi di taman botani diikuti perbincangan santai mengenai visi hidup bersama.`,
        `Kunjungan ke galeri seni atau festival buku untuk bertukar pandangan dalam suasana santai.`
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
      score: Math.max(72, Math.min(98, p.score - idx * 2)),
      whyTheyMatch: p.why,
      potentialChallenges: p.challenges,
      recommendedActivities: p.dates,
      valueSynthesisPercent: Math.min(99, 92 + (idx % 7)),
      frictionProbabilityPercent: Math.max(12, 18 + (idx % 10)),
      crossCheckedTraits: p.traits
    };
  });
}
