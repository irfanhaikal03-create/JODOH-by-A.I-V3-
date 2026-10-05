import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Participant, MatchResult, UserRole, AppUser } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  currentUser?: AppUser | null;
  participants: Participant[];
  matches: MatchResult[];
  matchesPublished: boolean;
  currentParticipantProfile?: Participant | null;
  initialCoupleRank?: number | 'ALL';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({
  isOpen,
  onClose,
  userRole,
  currentUser,
  participants,
  matches,
  matchesPublished,
  currentParticipantProfile,
  initialCoupleRank = 'ALL',
}) => {
  const { t, languageInfo } = useLanguage();
  const isAdmin = userRole === 'admin';

  // Identify participant's official match
  const myMatch = useMemo(() => {
    if (isAdmin || !currentParticipantProfile) return null;
    const nameLower = currentParticipantProfile.name.toLowerCase();
    return (
      matches.find(
        m =>
          m.maleId === currentParticipantProfile.id ||
          m.femaleId === currentParticipantProfile.id ||
          m.maleName.toLowerCase().includes(nameLower) ||
          nameLower.includes(m.maleName.toLowerCase()) ||
          m.femaleName.toLowerCase().includes(nameLower) ||
          nameLower.includes(m.femaleName.toLowerCase())
      ) || null
    );
  }, [isAdmin, currentParticipantProfile, matches]);

  // Extract partner details if participant
  const partnerInfo = useMemo(() => {
    if (!myMatch || !currentParticipantProfile) return null;
    const isMaleUser = currentParticipantProfile.gender === 'Male';

    return {
      partnerName: isMaleUser ? myMatch.femaleName : myMatch.maleName,
      partnerAge: isMaleUser ? myMatch.femaleAge : myMatch.maleAge,
      partnerOccupation: isMaleUser ? myMatch.femaleOccupation : myMatch.maleOccupation,
      partnerLocation: isMaleUser ? myMatch.femaleLocation : myMatch.maleLocation,
      partnerPhoto: isMaleUser ? myMatch.femalePhoto : myMatch.malePhoto,
      partnerSmoking: isMaleUser ? myMatch.femaleSmoking : myMatch.maleSmoking,
      partnerHobbies: isMaleUser ? myMatch.femaleHobbies : myMatch.maleHobbies,
      partnerIdeal: isMaleUser
        ? participants.find(p => p.id === myMatch.femaleId)?.ideal || 'Menghargai persefahaman & kematangan'
        : participants.find(p => p.id === myMatch.maleId)?.ideal || 'Menghargai persefahaman & kematangan',
      matchScore: myMatch.score,
      whyTheyMatch: myMatch.whyTheyMatch,
      potentialChallenges: myMatch.potentialChallenges,
      recommendedActivities: myMatch.recommendedActivities,
      matchRank: myMatch.rank,
    };
  }, [myMatch, currentParticipantProfile, participants]);

  // Admin selected match context (Admin can toggle between full cohort or specific couple)
  const [selectedCoupleRank, setSelectedCoupleRank] = useState<number | 'ALL'>(initialCoupleRank);

  useEffect(() => {
    if (initialCoupleRank !== undefined) {
      setSelectedCoupleRank(initialCoupleRank);
    }
  }, [initialCoupleRank]);

  const activeAdminCouple = useMemo(() => {
    if (selectedCoupleRank === 'ALL') return null;
    return matches.find(m => m.rank === selectedCoupleRank) || null;
  }, [selectedCoupleRank, matches]);

  // Chat storage key
  const storageKey = useMemo(() => {
    if (isAdmin) {
      return `jodoh_concierge_admin_${selectedCoupleRank}`;
    }
    return `jodoh_concierge_part_${partnerInfo?.partnerName || 'general'}`;
  }, [isAdmin, selectedCoupleRank, partnerInfo]);

  // Chat message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync / load messages when storageKey or context changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {}

    // Initial greeting if no previous conversation exists
    if (isAdmin) {
      if (activeAdminCouple) {
        setMessages([
          {
            id: `welcome-admin-${activeAdminCouple.rank}`,
            role: 'model',
            content: `Salam Administrator. Anda kini berada dalam dossier analisis khusus bagi **Pasangan #${activeAdminCouple.rank}: ${activeAdminCouple.maleName} (${activeAdminCouple.maleAge}) & ${activeAdminCouple.femaleName} (${activeAdminCouple.femaleAge})** dengan tahap keserasian **${activeAdminCouple.score}%**.
            
Bagaimanakah saya boleh membantu anda menguruskan pemadanan ini?
- 💡 **Ringkasan Keserasian**: Analisis mendalam kekuatan nilai dan personaliti mereka
- ☕ **Aktiviti Temu Janji**: Cadangan aktiviti bersesuaian dengan minat mereka (${activeAdminCouple.maleHobbies.slice(0, 2).concat(activeAdminCouple.femaleHobbies.slice(0, 2)).join(', ')})
- ⚠️ **Audit Geseran**: Risiko percanggahan jadual atau gaya hidup
- 💬 **Panduan Perbualan**: Topik pemecah kebuntuan untuk temu janji pertama mereka`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages([
          {
            id: 'welcome-admin-global',
            role: 'model',
            content: `Salam & Selamat Datang, Administrator. Saya ialah **AI Matchmaking Concierge** anda dengan akses penuh kepada seluruh kohort acara (${participants.length} peserta berdaftar, ${matches.length} padanan terhasil).

Saya sedia membantu anda dalam:
- 📊 **Analisis Keserasian Kohort**: Metrik purata, persefahaman nilai & tabiat hidup
- 🎪 **Aktiviti & Icebreakers Acara**: Rangka aktiviti interaktif tanpa tekanan bagi memeriahkan sesi suai kenal
- ⚠️ **Audit Titik Geseran**: Kenal pasti cabaran jadual dan cara mitigasi
- 👥 **Nasihat Setiap Pasangan**: Dapatkan nasihat dan panduan terperinci untuk mana-mana pasangan`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } else if (partnerInfo && matchesPublished) {
      setMessages([
        {
          id: 'welcome-partner',
          role: 'model',
          content: `Salam ${currentParticipantProfile?.name || 'anda'}! Saya ialah **AI Dating Advisor & Concierge Peribadi** anda khusus bersama pasangan rasmi anda, **${partnerInfo.partnerName}** (Skor Keserasian: **${partnerInfo.matchScore}%**).

Sebagai pembantu hubungan anda, saya sedia membantu dalam fasa perkenalan ini:
- 💡 **Ringkasan Padanan**: Mengapa anda dan ${partnerInfo.partnerName} dipadankan oleh AI serta kekuatan bersama anda
- ☕ **Cadangan Temu Janji**: 3 idea aktiviti kreatif berdasarkan minat ${partnerInfo.partnerName} dalam *${Array.isArray(partnerInfo.partnerHobbies) ? partnerInfo.partnerHobbies.join(', ') : 'gaya hidup'}*
- 💬 **Topik Perbualan**: Soalan menarik dan bermakna untuk mengelakkan kekok semasa berbual
- 🧭 **Nasihat Fasa Temu Janji**: Langkah bijak mengukuhkan ikatan emosi dan persefahaman
- ℹ️ **Maklumat Pasangan**: Butiran kerjaya, impian dan visi pasangan idaman ${partnerInfo.partnerName}

Apakah yang ingin anda ketahui mengenai ${partnerInfo.partnerName} hari ini?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages([
        {
          id: 'welcome-unmatched',
          role: 'model',
          content: `Salam! Keputusan rasmi pemadanan anda sedang dinilai dan diselaraskan oleh pihak penganjur acara. Sebaik sahaja Administrator menerbitkan keputusan pemadanan rasmi, saya akan sedia menjadi penasihat temu janji peribadi anda bersama pasangan rasmi yang dipadankan!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [storageKey, isAdmin, activeAdminCouple, partnerInfo, matchesPublished, currentParticipantProfile, participants.length, matches.length]);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Suggested prompt chips based on role and partner context
  const suggestedPrompts = useMemo(() => {
    if (isAdmin) {
      if (activeAdminCouple) {
        return [
          { label: '💡 Ringkasan Padanan', query: `Buat ringkasan mengapa Pasangan #${activeAdminCouple.rank} (${activeAdminCouple.maleName} & ${activeAdminCouple.femaleName}) serasi dan apa kekuatan nilai mereka.` },
          { label: '☕ 3 Cadangan Temu Janji', query: `Cadangkan 3 aktiviti temu janji khusus untuk ${activeAdminCouple.maleName} & ${activeAdminCouple.femaleName} berdasarkan minat mereka.` },
          { label: '⚠️ Audit Titik Geseran', query: `Apakah cabaran atau titik geseran utama bagi pasangan ini dan apakah nasihat mitigasi untuk penganjur?` },
          { label: '💬 Panduan Perbualan', query: `Berikan 4 soalan perbualan menarik untuk ${activeAdminCouple.maleName} dan ${activeAdminCouple.femaleName} semasa temu janji pertama.` },
        ];
      }
      return [
        { label: '📊 Analisis Keserasian Kohort', query: 'Analisis trend keserasian keseluruhan kohort dan tabiat gaya hidup para peserta.' },
        { label: '🎪 3 Aktiviti & Icebreaker Acara', query: 'Cadangkan 3 aktiviti suai kenal atau game icebreaker menarik untuk acara ini yang santai dan tidak kekok.' },
        { label: '⚠️ Audit Cabaran Utama', query: 'Audit titik geseran paling kerap di kalangan 10 pasangan teratas dan cara penganjur membimbing mereka.' },
        { label: '⭐ Mengapa Pasangan #1 Terbaik?', query: 'Terangkan mengapa Pasangan #1 menduduki tempat teratas dari sudut nilai hidup dan personaliti.' },
      ];
    } else if (partnerInfo && matchesPublished) {
      return [
        { label: '💡 Ringkasan Padanan', query: `Boleh buatkan ringkasan mengapa saya dan ${partnerInfo.partnerName} serasi dan apa kekuatan persamaan kami?` },
        { label: '☕ 3 Idea Temu Janji Khusus', query: `Cadangkan 3 idea temu janji kreatif dan santai khusus mengikut minat ${partnerInfo.partnerName}.` },
        { label: '💬 Topik & Soalan Menarik', query: `Apakah soalan perbualan yang menarik dan tidak kekok untuk saya tanyakan kepada ${partnerInfo.partnerName}?` },
        { label: '🧭 Kuatkan Hubungan', query: `Apakah aktiviti atau langkah terbaik untuk kami mengukuhkan hubungan dalam fasa awal temu janji ini?` },
        { label: 'ℹ️ Maklumat & Visi Pasangan', query: `Boleh ceritakan lebih lanjut mengenai latar belakang dan ciri pasangan idaman yang dihargai oleh ${partnerInfo.partnerName}?` },
        { label: '⚠️ Cabaran & Tip Jadual', query: `Apakah potensi cabaran antara saya dan ${partnerInfo.partnerName} serta bagaimana cara menanganinya dengan matang?` },
      ];
    }
    return [
      { label: '✨ Persiapan Acara', query: 'Bagaimanakah cara terbaik untuk saya mempersiapkan diri menghadapi acara suai kenal ini?' },
      { label: '🎯 Tip Temu Janji Pertama', query: 'Apakah etika dan tip penting untuk perbualan pertama yang membina daya tarikan positif?' },
    ];
  }, [isAdmin, activeAdminCouple, partnerInfo, matchesPublished]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const targetPartnerInfo =
        isAdmin && activeAdminCouple
          ? {
              partnerName: `${activeAdminCouple.maleName} & ${activeAdminCouple.femaleName}`,
              partnerAge: `${activeAdminCouple.maleAge} & ${activeAdminCouple.femaleAge}`,
              partnerOccupation: `${activeAdminCouple.maleOccupation} / ${activeAdminCouple.femaleOccupation}`,
              partnerLocation: `${activeAdminCouple.maleLocation} & ${activeAdminCouple.femaleLocation}`,
              partnerHobbies: [...activeAdminCouple.maleHobbies, ...activeAdminCouple.femaleHobbies],
              partnerSmoking: `${activeAdminCouple.maleSmoking} / ${activeAdminCouple.femaleSmoking}`,
              partnerIdeal: 'Kematangan emosi, komunikasi telus, persefahaman masa depan',
              matchScore: activeAdminCouple.score,
              whyTheyMatch: activeAdminCouple.whyTheyMatch,
              potentialChallenges: activeAdminCouple.potentialChallenges,
              recommendedActivities: activeAdminCouple.recommendedActivities,
            }
          : partnerInfo;

      const cohortContext = isAdmin
        ? {
            totalCandidates: participants.length,
            summaryList: participants.slice(0, 12).map(p => `${p.name} (${p.gender}, ${p.age}, ${p.occupation}, ${p.location})`),
          }
        : undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRole,
          userName: currentUser?.displayName || currentParticipantProfile?.name || 'Peserta',
          partnerInfo: targetPartnerInfo,
          cohortContext,
          messages: historyPayload,
          language: languageInfo.name || 'Malay',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply || 'Maaf, terdapat gangguan teknikal sementara. Sila cuba lagi sebentar lagi.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Concierge chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content:
          languageInfo.code === 'en'
            ? `I am currently operating in advisory mode. For your journey with **${partnerInfo?.partnerName || 'your partner'}**, focus on active curiosity, exploring shared interests like *${Array.isArray(partnerInfo?.partnerHobbies) ? partnerInfo?.partnerHobbies.join(', ') : 'lifestyle hobbies'}*, and open-ended conversation!`
            : `Saya kini dalam mod panduan perhubungan. Untuk temu janji anda bersama **${partnerInfo?.partnerName || 'pasangan anda'}**, utamakan mendengar dengan empati, terokai minat bersama seperti *${Array.isArray(partnerInfo?.partnerHobbies) ? partnerInfo?.partnerHobbies.join(', ') : 'hobi santai'}*, dan mulakan dengan perbualan yang santai!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(storageKey);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'model',
        content: isAdmin
          ? 'Perbualan telah diset semula. Sedia untuk menganalisis kohort atau memberikan panduan pemadanan terkini.'
          : `Perbualan telah diset semula. Sedia untuk membantu perjalanan temu janji anda bersama ${partnerInfo?.partnerName || 'pasangan anda'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => {
      setCopiedMessageId(prev => (prev === id ? null : prev));
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="concierge-title"
    >
      <div className="bg-surface-container-lowest text-on-surface rounded-2xl max-w-3xl w-full border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-[85vh]">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-outline-variant/20 bg-surface-container-low/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar / Badge */}
            {isAdmin ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs shrink-0 ring-2 ring-primary/20">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
            ) : partnerInfo?.partnerPhoto ? (
              <div className="relative shrink-0">
                <img
                  src={partnerInfo.partnerPhoto}
                  alt={partnerInfo.partnerName}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-primary/40 shadow-xs"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-xs shrink-0 ring-2 ring-secondary/20">
                <span className="material-symbols-outlined text-2xl">favorite</span>
              </div>
            )}

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="concierge-title" className="font-serif font-bold text-sm sm:text-base text-primary truncate leading-tight">
                  {isAdmin
                    ? 'AI Matchmaking Concierge'
                    : `AI Dating Advisor • ${partnerInfo ? partnerInfo.partnerName : 'Acara Suai Kenal'}`}
                </h2>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider shrink-0 border border-primary/20">
                    Admin Full Access
                  </span>
                ) : partnerInfo && matchesPublished ? (
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold shrink-0 border border-secondary/20">
                    {partnerInfo.matchScore}% Keserasian #{partnerInfo.matchRank}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold shrink-0">
                    Panduan Acara
                  </span>
                )}
              </div>

              <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                {isAdmin
                  ? activeAdminCouple
                    ? `Fokus Pasangan #${activeAdminCouple.rank}: ${activeAdminCouple.maleName} & ${activeAdminCouple.femaleName} (${activeAdminCouple.score}%)`
                    : 'Akses analitik penuh seluruh direktori acara, audit keserasian & aktiviti.'
                  : partnerInfo && matchesPublished
                  ? `Pasangan Rasmi: ${partnerInfo.partnerOccupation} • ${partnerInfo.partnerLocation} • Hobi: ${Array.isArray(partnerInfo.partnerHobbies) ? partnerInfo.partnerHobbies.slice(0, 2).join(', ') : 'Gaya Hidup'}`
                  : 'Panduan persiapan acara suai kenal dan tip perhubungan berkuasa AI.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Set Semula Perbualan"
              className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Administrator Couple Selection Bar (Full Access Mode) */}
        {isAdmin && matches.length > 0 && (
          <div className="px-3.5 py-2 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between gap-2 shrink-0 text-xs">
            <span className="font-semibold text-outline text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">filter_alt</span>
              <span>Fokus Analisis:</span>
            </span>
            <select
              value={selectedCoupleRank}
              onChange={e => setSelectedCoupleRank(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary truncate max-w-[280px] sm:max-w-none shadow-2xs"
            >
              <option value="ALL">🌐 Seluruh Kohort (Global Matchmaking Insights & Icebreakers)</option>
              {matches.map(m => (
                <option key={m.rank} value={m.rank}>
                  #{m.rank} {m.maleName} & {m.femaleName} ({m.score}% Affinity)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Participant Official Partner Spotlight Banner (Top of Chat) */}
        {!isAdmin && partnerInfo && matchesPublished && (
          <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/10 flex items-center justify-between gap-3 shrink-0 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-base shrink-0">volunteer_activism</span>
              <span className="text-on-surface font-medium truncate">
                AI ini disesuaikan <strong>khusus untuk anda & {partnerInfo.partnerName}</strong>. Bincang idea temu janji, topik perbualan, atau cara memperkukuh ikatan.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold shrink-0">
              Eksklusif Pasangan Rasmi
            </span>
          </div>
        )}

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-surface-container-lowest">
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[90%] sm:max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                    isUser
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {isUser ? (
                    currentUser?.displayName?.charAt(0).toUpperCase() || 'U'
                  ) : (
                    <span className="material-symbols-outlined text-sm sm:text-base">auto_awesome</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
                    isUser
                      ? 'bg-primary text-on-primary rounded-tr-xs'
                      : 'bg-surface-container-low text-on-surface rounded-tl-xs border border-outline-variant/20'
                  }`}
                >
                  {/* Copy Button for Bot Response */}
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-surface-container/80 text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                      title="Salin jawapan"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {copiedMessageId === msg.id ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  )}

                  <div className="whitespace-pre-wrap font-sans space-y-1">
                    {msg.content.split('\n').map((line, idx) => {
                      if (line.startsWith('### ')) {
                        return (
                          <h4 key={idx} className="font-serif font-bold text-sm sm:text-base text-primary mt-2 mb-1">
                            {line.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (line.startsWith('## ')) {
                        return (
                          <h3 key={idx} className="font-serif font-bold text-base sm:text-lg text-primary mt-2 mb-1">
                            {line.replace('## ', '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('- ') || line.startsWith('• ')) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 my-0.5 ml-1">
                            <span className="text-primary font-bold leading-none mt-1">•</span>
                            <span className="flex-1">{line.substring(2)}</span>
                          </div>
                        );
                      }
                      if (/^\d+\.\s/.test(line)) {
                        const num = line.match(/^\d+\./)?.[0] || '1.';
                        const rest = line.replace(/^\d+\.\s*/, '');
                        return (
                          <div key={idx} className="flex items-start gap-1.5 my-1 ml-1">
                            <span className="px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                              {num}
                            </span>
                            <span className="flex-1 font-medium">{rest}</span>
                          </div>
                        );
                      }
                      return <p key={idx} className={line.trim() === '' ? 'h-1.5' : 'my-0.5'}>{line}</p>;
                    })}
                  </div>

                  <span
                    className={`text-[9px] block text-right mt-1.5 opacity-70 font-medium ${
                      isUser ? 'text-on-primary' : 'text-outline'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 mr-auto max-w-[85%]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-container-low text-on-surface-variant text-xs flex items-center gap-2.5 border border-outline-variant/20 rounded-tl-xs shadow-xs">
                <span className="material-symbols-outlined text-base text-primary animate-pulse">psychology</span>
                <span className="font-semibold animate-pulse">
                  {isAdmin
                    ? 'AI Concierge sedang menganalisis data kohort...'
                    : `AI Advisor sedang merangka jawapan khusus untuk anda & ${partnerInfo?.partnerName || 'pasangan'}...`}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Shelf (Quick Action Buttons) */}
        <div className="px-3.5 py-2.5 bg-surface-container-low/70 border-t border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <span className="material-symbols-outlined text-xs text-primary">lightbulb</span>
              <span>Cadangan Pantas:</span>
            </span>
            {suggestedPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(item.query)}
                className="px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface whitespace-nowrap transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Form */}
        <div className="p-3.5 sm:p-4 bg-surface-container-low/90 border-t border-outline-variant/20 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              disabled={isLoading}
              placeholder={
                isAdmin
                  ? activeAdminCouple
                    ? `Tanya soalan mengenai Couple #${activeAdminCouple.rank} (${activeAdminCouple.maleName} & ${activeAdminCouple.femaleName})...`
                    : 'Tanya soalan tentang kohort, icebreaker, atau aktiviti suai kenal...'
                  : partnerInfo && matchesPublished
                  ? `Tanya idea aktiviti, recap, atau tip hubungan dengan ${partnerInfo.partnerName}...`
                  : 'Taip soalan atau mesej anda di sini...'
              }
              className="flex-1 px-4 py-2.5 sm:py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 shadow-inner"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm transition-all shadow-sm hover:opacity-95 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              <span>Hantar</span>
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
