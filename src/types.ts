export type UserRole = 'admin' | 'participant';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  participantId?: string;
}

export interface Participant {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  age: number;
  occupation: string;
  location: string;
  marital: 'Single' | 'Divorced' | 'Widowed';
  smoking: 'Non-Smoker' | 'Smoker';
  hobbies: string[] | string;
  ideal: string;
  photo?: string;
  ownerId?: string;
  userId?: string;
  userEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchResult {
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
  valueSynthesisPercent?: number;
  frictionProbabilityPercent?: number;
  crossCheckedTraits?: string[];
  ownerId?: string;
  createdAt?: string;
}

export interface SavedMatchSession {
  id: string;
  title: string;
  createdAt: string;
  matches: MatchResult[];
  isPublished: boolean;
  savedBy?: string;
  participantsCount: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiChatSession {
  id: string;
  participantId: string;
  participantName: string;
  participantGender?: 'Male' | 'Female';
  participantEmail?: string;
  partnerId?: string;
  partnerName: string;
  partnerOccupation?: string;
  matchScore?: number;
  coupleRank?: number | 'ALL';
  messages: AiChatMessage[];
  lastMessage?: string;
  lastUpdated: string;
  createdAt?: string;
}
