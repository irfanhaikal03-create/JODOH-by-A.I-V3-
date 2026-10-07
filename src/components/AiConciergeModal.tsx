import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Participant, MatchResult, UserRole, AppUser, AiChatSession } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

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

  // Admin Top View Mode: 'audit-logs' (Monitor Participants' Chats) or 'ai-concierge' (Admin Strategy Advisor)
  const [adminViewMode, setAdminViewMode] = useState<'audit-logs' | 'ai-concierge'>(
    isAdmin ? 'audit-logs' : 'ai-concierge'
  );

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
      partnerId: isMaleUser ? myMatch.femaleId : myMatch.maleId,
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

  // Chat storage key for local cache
  const storageKey = useMemo(() => {
    if (isAdmin) {
      return `jodoh_concierge_admin_${selectedCoupleRank}`;
    }
    return `jodoh_concierge_part_${currentParticipantProfile?.id || partnerInfo?.partnerName || 'general'}`;
  }, [isAdmin, selectedCoupleRank, currentParticipantProfile, partnerInfo]);

  // Chat message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time Cloud Audit Log of all participant conversations (for Administrator)
  const [participantChatSessions, setParticipantChatSessions] = useState<AiChatSession[]>([]);
  const [selectedAuditSessionId, setSelectedAuditSessionId] = useState<string | null>(null);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditCoupleFilter, setAuditCoupleFilter] = useState<number | 'ALL'>('ALL');

  // Listen to Cloud Firestore ai_chats collection
  useEffect(() => {
    if (!isOpen) return;

    const chatsCol = collection(db, 'ai_chats');
    const unsubscribe = onSnapshot(
      chatsCol,
      snapshot => {
        const sessions: AiChatSession[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as AiChatSession;
          sessions.push(data);
        });
        sessions.sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());
        setParticipantChatSessions(sessions);

        if (isAdmin && !selectedAuditSessionId && sessions.length > 0) {
          setSelectedAuditSessionId(sessions[0].id);
        }
      },
      err => {
        console.warn('Firestore ai_chats listener notice:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen, isAdmin]);

  // Load participant's own cloud chat history if available
  useEffect(() => {
    if (!isAdmin && currentParticipantProfile && isOpen) {
      const mySession = participantChatSessions.find(
        s => s.participantId === currentParticipantProfile.id || s.id === `chat-${currentParticipantProfile.id}`
      );
      if (mySession && mySession.messages && mySession.messages.length > 0) {
        setMessages(
          mySession.messages.map(m => ({
            id: m.id,
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
            timestamp: m.timestamp,
          }))
        );
        return;
      }
    }

    // Otherwise load from localStorage or initialize greeting
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
  }, [storageKey, isAdmin, activeAdminCouple, partnerInfo, matchesPublished, currentParticipantProfile, participants.length, matches.length, isOpen]);

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

  // Send message handler (Saves to Firestore so Administrator can see!)
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessagesList = [...messages, userMsg];
    setMessages(newMessagesList);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = newMessagesList.map(m => ({
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

      const finalMessages = [...newMessagesList, botMsg];
      setMessages(finalMessages);

      // CRITICAL: If current user is a participant, persist this chat to Cloud Firestore
      // so that the Administrator has FULL REAL-TIME ACCESS to their chat history and their partner!
      if (!isAdmin && currentParticipantProfile && partnerInfo) {
        const chatId = `chat-${currentParticipantProfile.id}`;
        const chatDoc: AiChatSession = {
          id: chatId,
          participantId: currentParticipantProfile.id,
          participantName: currentParticipantProfile.name,
          participantGender: currentParticipantProfile.gender,
          participantEmail: currentParticipantProfile.userEmail || '',
          partnerId: partnerInfo.partnerId || '',
          partnerName: partnerInfo.partnerName,
          partnerOccupation: partnerInfo.partnerOccupation,
          matchScore: partnerInfo.matchScore,
          coupleRank: partnerInfo.matchRank,
          messages: finalMessages.map(m => ({
            id: m.id,
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.content,
            timestamp: m.timestamp,
          })),
          lastMessage: botMsg.content.slice(0, 300),
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'ai_chats', chatId), chatDoc);
        } catch (fsErr) {
          console.warn('Firestore ai_chats save notice:', fsErr);
        }
      }
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

  // Filtered participant chat sessions for Administrator Audit view
  const filteredAuditSessions = useMemo(() => {
    return participantChatSessions.filter(session => {
      if (auditCoupleFilter !== 'ALL' && session.coupleRank !== auditCoupleFilter) {
        return false;
      }
      if (auditSearchQuery.trim()) {
        const query = auditSearchQuery.toLowerCase();
        const partMatch = session.participantName.toLowerCase().includes(query);
        const partnerMatch = session.partnerName.toLowerCase().includes(query);
        if (!partMatch && !partnerMatch) return false;
      }
      return true;
    });
  }, [participantChatSessions, auditCoupleFilter, auditSearchQuery]);

  const selectedAuditSession = useMemo(() => {
    return participantChatSessions.find(s => s.id === selectedAuditSessionId) || filteredAuditSessions[0] || null;
  }, [participantChatSessions, selectedAuditSessionId, filteredAuditSessions]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="concierge-title"
    >
      <div className="bg-surface-container-lowest text-on-surface rounded-2xl max-w-4xl w-full border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-[88vh]">
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
                    ? 'AI Matchmaking Concierge & Audit Suapan Peserta'
                    : `AI Dating Advisor • ${partnerInfo ? partnerInfo.partnerName : 'Acara Suai Kenal'}`}
                </h2>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider shrink-0 border border-primary/20">
                    Akses Penuh Administrator
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
                  ? adminViewMode === 'audit-logs'
                    ? `Audit Langsung: Memantau perbualan & pertanyaan setiap peserta bersama pasangan rasmi mereka.`
                    : activeAdminCouple
                    ? `Fokus Pasangan #${activeAdminCouple.rank}: ${activeAdminCouple.maleName} & ${activeAdminCouple.femaleName} (${activeAdminCouple.score}%)`
                    : 'Akses analitik penuh seluruh direktori acara, audit keserasian & aktiviti.'
                  : partnerInfo && matchesPublished
                  ? `Pasangan Rasmi: ${partnerInfo.partnerOccupation} • ${partnerInfo.partnerLocation} • Hobi: ${Array.isArray(partnerInfo.partnerHobbies) ? partnerInfo.partnerHobbies.slice(0, 2).join(', ') : 'Gaya Hidup'}`
                  : 'Panduan persiapan acara suai kenal dan tip perhubungan berkuasa AI.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {adminViewMode === 'ai-concierge' && (
              <button
                type="button"
                onClick={handleClearHistory}
                title="Set Semula Perbualan"
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">delete_sweep</span>
              </button>
            )}
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

        {/* Administrator Dual-Tab Control Bar (Audit Logs vs AI Advisor) */}
        {isAdmin && (
          <div className="bg-surface-container-low border-b border-outline-variant/20 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminViewMode('audit-logs')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminViewMode === 'audit-logs'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base">forum</span>
                <span>Log Perbualan Peserta & Pasangan</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    adminViewMode === 'audit-logs'
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {participantChatSessions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdminViewMode('ai-concierge')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminViewMode === 'ai-concierge'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base">psychology_alt</span>
                <span>Penasihat Strategik Acara AI</span>
              </button>
            </div>

            <span className="text-[11px] text-outline font-medium hidden sm:inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cloud Firestore Real-Time Sync</span>
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN VIEW MODE 1: PARTICIPANT CHAT HISTORY AUDIT LOGS                    */}
        {/* ========================================================================= */}
        {isAdmin && adminViewMode === 'audit-logs' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-surface-container-lowest">
            {/* Left Column: Participant Chat Sessions Directory */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col shrink-0 bg-surface-container-low/40">
              {/* Search & Filter Bar */}
              <div className="p-3 border-b border-outline-variant/20 space-y-2 shrink-0">
                <div className="relative">
                  <span className="material-symbols-outlined text-sm text-outline absolute left-2.5 top-2.5">
                    search
                  </span>
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={e => setAuditSearchQuery(e.target.value)}
                    placeholder="Cari peserta atau pasangan..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {matches.length > 0 && (
                  <select
                    value={auditCoupleFilter}
                    onChange={e => setAuditCoupleFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-[11px] font-semibold text-on-surface"
                  >
                    <option value="ALL">Semua Pasangan (#{1} - #{matches.length})</option>
                    {matches.map(m => (
                      <option key={m.rank} value={m.rank}>
                        Pasangan #{m.rank}: {m.maleName} & {m.femaleName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredAuditSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl text-outline mb-2 block">
                      chat_bubble_outline
                    </span>
                    <p className="font-semibold text-on-surface mb-1">Tiada Rekod Perbualan</p>
                    <p className="text-[11px] text-outline leading-relaxed">
                      {participantChatSessions.length === 0
                        ? 'Peserta belum memulakan perbualan dengan AI Dating Advisor. Sebaik sahaja mereka berbual, rekod dan pertanyaan mereka akan dipaparkan di sini secara langsung.'
                        : 'Tiada peserta sepadan dengan carian anda.'}
                    </p>
                  </div>
                ) : (
                  filteredAuditSessions.map(session => {
                    const isSelected = selectedAuditSession?.id === session.id;
                    const messageCount = session.messages?.length || 0;
                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedAuditSessionId(session.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-2xs'
                            : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50 hover:bg-surface-container-low/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isSelected ? 'bg-primary' : 'bg-secondary'
                              }`}
                            ></span>
                            <h4 className="text-xs font-bold text-on-surface truncate">
                              {session.participantName}
                            </h4>
                          </div>

                          <span className="text-[10px] text-outline shrink-0 font-medium">
                            {session.coupleRank ? `#${session.coupleRank}` : ''}
                          </span>
                        </div>

                        <div className="text-[11px] text-primary font-semibold flex items-center gap-1 truncate mb-1">
                          <span className="material-symbols-outlined text-xs">favorite</span>
                          <span>Pasangan: {session.partnerName}</span>
                        </div>

                        {session.lastMessage && (
                          <p className="text-[10px] text-on-surface-variant truncate italic mb-1.5">
                            "{session.lastMessage}"
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-outline pt-1 border-t border-outline-variant/15">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">forum</span>
                            <span>{messageCount} mesej</span>
                          </span>
                          <span>
                            {session.lastUpdated ? new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Full Conversation Log for Selected Participant */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-surface-container-lowest">
              {selectedAuditSession ? (
                <>
                  {/* Participant & Partner Dossier Bar */}
                  <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low/50 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
                        {selectedAuditSession.participantName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-on-surface truncate">
                            {selectedAuditSession.participantName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold shrink-0">
                            Dipadankan dengan: {selectedAuditSession.partnerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                          Pasangan #{selectedAuditSession.coupleRank || 1} • Skor Keserasian: {selectedAuditSession.matchScore || 85}% • {selectedAuditSession.messages?.length || 0} Pertukaran Mesej
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const transcript = selectedAuditSession.messages
                          .map(m => `[${m.role.toUpperCase()} - ${m.timestamp}]:\n${m.content}\n`)
                          .join('\n');
                        navigator.clipboard.writeText(transcript);
                        alert('Transkrip penuh perbualan peserta telah disalin ke papan keratan.');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span className="hidden sm:inline">Salin Transkrip Log</span>
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-surface-container-lowest">
                    {selectedAuditSession.messages.map((msg, idx) => {
                      const isBot = msg.role === 'assistant';
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex items-start gap-2.5 max-w-[88%] ${
                            isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold ${
                              isBot
                                ? 'bg-primary text-on-primary'
                                : 'bg-secondary text-on-secondary'
                            }`}
                          >
                            {isBot ? 'AI' : selectedAuditSession.participantName.charAt(0)}
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isBot
                                ? 'bg-surface-container-low text-on-surface border border-outline-variant/30 rounded-tl-xs'
                                : 'bg-primary text-on-primary rounded-tr-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75">
                              <span className="font-bold">
                                {isBot ? 'AI Dating Advisor' : selectedAuditSession.participantName}
                              </span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Status */}
                  <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low/30 text-[11px] text-on-surface-variant flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-1.5 text-primary font-medium">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>Mod Audit Telus: Administrator mempunyai capaian penuh perbualan peserta & pasangan.</span>
                    </span>
                    <span className="text-outline">
                      Kemaskini: {new Date(selectedAuditSession.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">
                    quick_reference_all
                  </span>
                  <p className="text-sm font-bold text-on-surface mb-1">
                    Pilih Peserta Dari Senarai Kiri
                  </p>
                  <p className="text-xs text-outline max-w-sm">
                    Pilih mana-mana peserta untuk melihat transkrip penuh perkara yang dibincangkan bersama AI Dating Advisor mengenai pasangan mereka.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* REGULAR CHAT INTERFACE (For Participant Mode OR Admin Strategic Advisor)  */
          /* ========================================================================= */
          <>
            {/* Administrator Couple Selection Bar (When in AI Advisor Tab) */}
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
                      Pasangan #{m.rank}: {m.maleName} ({m.maleAge}) & {m.femaleName} ({m.femaleAge}) — {m.score}%
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Chat Messages Feed */}
            <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-surface-container-lowest">
              {messages.map(msg => {
                const isBot = msg.role === 'model';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${
                      isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    {/* Role Avatar */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-2xs font-bold ${
                        isBot
                          ? 'bg-primary text-on-primary'
                          : 'bg-secondary text-on-secondary'
                      }`}
                    >
                      {isBot ? (
                        <span className="material-symbols-outlined text-base">smart_toy</span>
                      ) : (
                        currentUser?.displayName?.charAt(0) || currentParticipantProfile?.name.charAt(0) || 'P'
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`relative group p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isBot
                          ? 'bg-surface-container-low text-on-surface border border-outline-variant/30 rounded-tl-xs'
                          : 'bg-primary text-on-primary rounded-tr-xs shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                        <span className="font-bold">
                          {isBot
                            ? isAdmin
                              ? 'AI Concierge Penganjur'
                              : 'AI Dating Advisor'
                            : currentUser?.displayName || currentParticipantProfile?.name || 'Anda'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                      {/* Copy Action button on hover */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        title="Salin Teks"
                        className={`absolute -bottom-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-[10px] cursor-pointer shadow-xs ${
                          isBot
                            ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                            : 'bg-primary-container text-on-primary-container hover:bg-primary-container/80'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {copiedMessageId === msg.id ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2.5 max-w-[80%] mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base animate-pulse">smart_toy</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant rounded-tl-xs flex items-center gap-2 shadow-2xs">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-[11px] text-outline font-medium">
                      AI Dating Advisor sedang menganalisis profil & merangka jawapan...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Quick Prompt Chips */}
            <div className="p-2 sm:p-2.5 bg-surface-container-low/60 border-t border-outline-variant/20 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider shrink-0 mr-1 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs text-primary">tips_and_updates</span>
                  <span>Cadangan:</span>
                </span>
                {suggestedPrompts.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.query)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-[11px] font-semibold transition-all hover:border-primary/40 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 sm:p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder={
                  isAdmin
                    ? 'Tanya AI mengenai dinamik kohort, aktiviti suai kenal, atau mana-mana pasangan...'
                    : partnerInfo && matchesPublished
                    ? `Tanya soalan mengenai ${partnerInfo.partnerName}, cadangan aktiviti, atau tip temu janji...`
                    : 'Tulis soalan anda kepada AI Concierge...'
                }
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                <span className="hidden sm:inline">Hantar</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
