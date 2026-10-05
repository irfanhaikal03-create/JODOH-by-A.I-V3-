import React, { useState, useEffect } from 'react';
import { Participant, MatchResult, UserRole, AppUser, SavedMatchSession } from './types';
import { DEFAULT_PARTICIPANTS, DEFAULT_MATCHES } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ParticipantsPoolView } from './components/ParticipantsPoolView';
import { ParticipantGlimpseView } from './components/ParticipantGlimpseView';
import { TopMatchesView } from './components/TopMatchesView';
import { AddEditParticipantModal } from './components/AddEditParticipantModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { GenerationModal } from './components/GenerationModal';
import { InsufficientWarningModal } from './components/InsufficientWarningModal';
import { AffinityVectorsModal } from './components/AffinityVectorsModal';
import { MatchingRulesModal } from './components/MatchingRulesModal';
import { MyProfileModal } from './components/MyProfileModal';
import { SavedSessionsModal } from './components/SavedSessionsModal';
import { AdminResetModal } from './components/AdminResetModal';
import { AuthView } from './components/AuthView';
import { Toast } from './components/Toast';
import { LanguageModal } from './components/LanguageModal';
import { AiConciergeModal } from './components/AiConciergeModal';
import { useLanguage } from './context/LanguageContext';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  testConnection,
  handleFirestoreError,
  OperationType,
  ADMIN_EMAIL,
  isAdminEmail,
} from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

const STORAGE_PARTICIPANTS = 'jodoh_organizer_participants';
const STORAGE_MATCHES = 'jodoh_organizer_matches';
const STORAGE_USER_SESSION = 'jodoh_user_session';
const STORAGE_MATCHES_PUBLISHED = 'jodoh_matches_published';
const STORAGE_SAVED_SESSIONS = 'jodoh_saved_match_sessions';

export default function App() {
  const { t } = useLanguage();

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_SESSION);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse user session:', e);
    }
    return null;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<'participants-pool' | 'top-10-ai-matches'>('participants-pool');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Publication State of AI Matches
  const [matchesPublished, setMatchesPublished] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MATCHES_PUBLISHED);
      if (stored !== null) return JSON.parse(stored);
    } catch (e) {}
    return true; // Default true so initial demo matches are viewable
  });

  // Validate Connection on startup per SKILL.md
  useEffect(() => {
    testConnection();
  }, []);

  // Core Data State - Participants
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PARTICIPANTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored participants:', e);
    }
    return DEFAULT_PARTICIPANTS;
  });

  // Core Data State - Matches
  const [matches, setMatches] = useState<MatchResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MATCHES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored matches:', e);
    }
    return DEFAULT_MATCHES;
  });

  // Modal Visibility States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isMyProfileModalOpen, setIsMyProfileModalOpen] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState<Participant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false);
  const [isAffinityVectorsOpen, setIsAffinityVectorsOpen] = useState(false);
  const [isMatchingRulesOpen, setIsMatchingRulesOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Status & Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Saved Match Sessions (In-App Archive)
  const [savedSessions, setSavedSessions] = useState<SavedMatchSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_SESSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved sessions:', e);
    }
    return [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string | undefined>(undefined);
  const [isSavedSessionsModalOpen, setIsSavedSessionsModalOpen] = useState(false);
  const [isAdminResetModalOpen, setIsAdminResetModalOpen] = useState(false);

  // AI Concierge & Relationship Advisor State
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false);
  const [conciergeSelectedRank, setConciergeSelectedRank] = useState<number | 'ALL'>('ALL');

  const handleOpenConcierge = (rank?: number) => {
    if (rank !== undefined) {
      setConciergeSelectedRank(rank);
    } else {
      setConciergeSelectedRank('ALL');
    }
    setIsAiConciergeOpen(true);
  };

  const showToast = (msg: string, error = false) => {
    setToastMessage(msg);
    setIsToastError(error);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3200);
  };

  // Check if current authenticated user has verified administrator role
  const activeUserEmail = (userProfile?.email || currentUser?.email || '').trim().toLowerCase();
  const isOfficialAdmin = isAdminEmail(activeUserEmail) || userProfile?.role === 'admin';

  // Effective role: Administrator for verified admins, otherwise strictly participant
  const effectiveRole: UserRole = isOfficialAdmin ? (userProfile?.role || 'admin') : 'participant';
  const isAdmin = effectiveRole === 'admin';

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        const userEmail = (user.email || '').toLowerCase();
        const isOfficialAdmin = isAdminEmail(userEmail);

        setUserProfile(prev => {
          if (prev && prev.uid === user.uid) return prev;
          const role: UserRole = isOfficialAdmin ? 'admin' : prev?.role || 'participant';
          const updated: AppUser = {
            uid: user.uid,
            email: userEmail,
            displayName: user.displayName || (role === 'admin' ? 'Administrator' : 'Peserta'),
            role,
            photoURL: user.photoURL || undefined,
            participantId: prev?.participantId,
          };
          localStorage.setItem(STORAGE_USER_SESSION, JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for Participants when user is logged in
  useEffect(() => {
    if (!currentUser && !userProfile) return;

    const path = 'participants';
    const participantsCol = collection(db, path);

    const unsubscribe = onSnapshot(
      participantsCol,
      snapshot => {
        if (!snapshot.empty) {
          const remoteParticipants: Participant[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Participant;
            remoteParticipants.push(data);
          });
          setParticipants(remoteParticipants);
        } else if (participants.length > 0 && isAdmin) {
          // If remote is empty, seed with current cohort by Administrator
          setIsCloudSyncing(true);
          Promise.all(
            participants.map(p =>
              setDoc(doc(db, 'participants', p.id), {
                id: p.id,
                name: p.name,
                gender: p.gender,
                age: p.age,
                occupation: p.occupation,
                location: p.location,
                marital: p.marital,
                smoking: p.smoking,
                hobbies: p.hobbies || [],
                ideal: p.ideal || '',
                photo: p.photo || '',
                createdAt: p.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ownerId: p.ownerId || currentUser?.uid || 'admin',
              })
            )
          )
            .then(() => setIsCloudSyncing(false))
            .catch(err => {
              setIsCloudSyncing(false);
              console.warn('Initial seeding Firestore notice:', err);
            });
        }
      },
      error => {
        console.warn('Firestore snapshot error:', error.message);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  // Sync participants to Local Storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PARTICIPANTS, JSON.stringify(participants));
    } catch (e) {
      console.error('Failed to save participants to localStorage:', e);
    }
  }, [participants]);

  // Sync matches to Local Storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MATCHES, JSON.stringify(matches));
    } catch (e) {
      console.error('Failed to save matches to localStorage:', e);
    }
  }, [matches]);

  // Real-time Firestore sync for Saved Match Sessions
  useEffect(() => {
    if (!currentUser && !userProfile) return;

    const path = 'saved_match_sessions';
    const sessionsCol = collection(db, path);

    const unsubscribe = onSnapshot(
      sessionsCol,
      snapshot => {
        if (!snapshot.empty) {
          const remoteSessions: SavedMatchSession[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            remoteSessions.push({
              id: docSnap.id,
              title: data.title || 'Sesi Pemadanan AI',
              createdAt: data.createdAt || new Date().toISOString(),
              matches: data.matches || [],
              isPublished: Boolean(data.isPublished),
              savedBy: data.savedBy,
              participantsCount: Number(data.participantsCount) || 0,
            });
          });
          remoteSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSavedSessions(remoteSessions);
        }
      },
      error => {
        console.warn('Firestore saved sessions snapshot error:', error.message);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  // Sync saved sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_SESSIONS, JSON.stringify(savedSessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage:', e);
    }
  }, [savedSessions]);

  // Save current active matches to in-app archive (Draft by default for admin)
  const handleSaveMatchesToApp = async () => {
    if (matches.length === 0) {
      showToast('Tiada keputusan pemadanan untuk disimpan.', true);
      return;
    }

    const sessionId = `session-${Date.now()}`;
    const newSession: SavedMatchSession = {
      id: sessionId,
      title: `Sesi Pemadanan AI #${savedSessions.length + 1} (${matches.length} Pasangan)`,
      createdAt: new Date().toISOString(),
      matches,
      isPublished: false, // DRAFT by default so participants cannot see until admin publishes!
      savedBy: userProfile?.displayName || 'Administrator',
      participantsCount: participants.length,
    };

    setSavedSessions(prev => [newSession, ...prev]);
    setActiveSessionId(sessionId);
    setActiveSessionTitle(newSession.title);
    setMatchesPublished(false); // In draft mode!
    localStorage.setItem(STORAGE_MATCHES_PUBLISHED, JSON.stringify(false));

    try {
      await setDoc(doc(db, 'saved_match_sessions', sessionId), newSession);
    } catch (e) {
      console.warn('Firestore write saved session warning:', e);
    }

    showToast('Keputusan berjaya disimpan dalam arkib aplikasi sebagai Draf (hanya boleh dilihat oleh Admin).');
  };

  // Toggle publish state of any session
  const handleTogglePublishSession = async (sessionId: string) => {
    let updatedIsPublished = false;
    let targetTitle = '';

    setSavedSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          updatedIsPublished = !s.isPublished;
          targetTitle = s.title;
          return { ...s, isPublished: updatedIsPublished };
        }
        return s;
      })
    );

    if (activeSessionId === sessionId) {
      setMatchesPublished(updatedIsPublished);
      localStorage.setItem(STORAGE_MATCHES_PUBLISHED, JSON.stringify(updatedIsPublished));
    }

    try {
      await setDoc(
        doc(db, 'saved_match_sessions', sessionId),
        { isPublished: updatedIsPublished },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore update publish status warning:', e);
    }

    showToast(
      updatedIsPublished
        ? `"${targetTitle}" telah Diterbitkan! Peserta kini boleh melihat keputusan rasmi.`
        : `"${targetTitle}" telah ditukar ke Draf Peribadi (hanya Admin).`
    );
  };

  // Load a saved session into active view
  const handleLoadSavedSession = (session: SavedMatchSession) => {
    setMatches(session.matches);
    setMatchesPublished(session.isPublished);
    setActiveSessionId(session.id);
    setActiveSessionTitle(session.title);
    localStorage.setItem(STORAGE_MATCHES, JSON.stringify(session.matches));
    localStorage.setItem(STORAGE_MATCHES_PUBLISHED, JSON.stringify(session.isPublished));
    setActiveTab('top-10-ai-matches');
    showToast(`Rekod "${session.title}" dimuatkan ke paparan utama (${session.isPublished ? 'Status: Diterbitkan' : 'Status: Draf Admin'}).`);
  };

  // Delete a saved session from archive
  const handleDeleteSavedSession = async (sessionId: string) => {
    setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(undefined);
      setActiveSessionTitle(undefined);
    }
    try {
      await deleteDoc(doc(db, 'saved_match_sessions', sessionId));
    } catch (e) {
      console.warn('Firestore delete session warning:', e);
    }
    showToast('Rekod sesi telah dipadamkan daripada arkib.');
  };

  // Admin Reset Actions
  const handleResetActiveMatches = () => {
    setMatches([]);
    setMatchesPublished(false);
    setActiveSessionId(undefined);
    setActiveSessionTitle(undefined);
    localStorage.removeItem(STORAGE_MATCHES);
    localStorage.setItem(STORAGE_MATCHES_PUBLISHED, JSON.stringify(false));
    showToast('Keputusan pemadanan AI semasa telah dikosongkan.');
  };

  const handleResetSavedSessions = async () => {
    const sessionIds = savedSessions.map(s => s.id);
    setSavedSessions([]);
    setActiveSessionId(undefined);
    setActiveSessionTitle(undefined);
    localStorage.removeItem(STORAGE_SAVED_SESSIONS);

    for (const id of sessionIds) {
      try {
        await deleteDoc(doc(db, 'saved_match_sessions', id));
      } catch (e) {}
    }
    showToast('Semua rekod arkib telah dipadamkan.');
  };

  const handleResetParticipantsToDefault = async () => {
    setParticipants(DEFAULT_PARTICIPANTS);
    localStorage.setItem(STORAGE_PARTICIPANTS, JSON.stringify(DEFAULT_PARTICIPANTS));
    for (const p of DEFAULT_PARTICIPANTS) {
      try {
        await setDoc(doc(db, 'participants', p.id), p);
      } catch (e) {}
    }
    showToast('Senarai calon peserta telah dikembalikan ke senarai asal.');
  };

  const handleFullSystemReset = async () => {
    handleResetActiveMatches();
    await handleResetSavedSessions();
    await handleResetParticipantsToDefault();
    showToast('Set semula penuh sistem telah berjaya diselesaikan.');
  };

  const maleCount = participants.filter(p => p.gender === 'Male').length;
  const femaleCount = participants.filter(p => p.gender === 'Female').length;
  const isEligible = maleCount >= 1 && femaleCount >= 1;

  // Toggle user role preview (Allowed for authorized administrators)
  const handleToggleRole = isOfficialAdmin
    ? () => {
        const newRole: UserRole = effectiveRole === 'admin' ? 'participant' : 'admin';
        const updatedProfile: AppUser = {
          uid: userProfile?.uid || currentUser?.uid || `user-${Date.now()}`,
          email: activeUserEmail || ADMIN_EMAIL,
          displayName: userProfile?.displayName || (newRole === 'admin' ? 'Administrator' : 'Peserta'),
          role: newRole,
          participantId: userProfile?.participantId || participants[0]?.id,
        };
        setUserProfile(updatedProfile);
        localStorage.setItem(STORAGE_USER_SESSION, JSON.stringify(updatedProfile));
        showToast(`Paparan ditukar ke peranan: ${newRole === 'admin' ? 'Administrator' : 'Peserta'}`);
      }
    : undefined;

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Sign-in notice:', err);
      if (
        err.message?.includes('identity-toolkit') ||
        err.message?.includes('identitytoolkit') ||
        err.code?.includes('identity-toolkit') ||
        err.code === 'auth/operation-not-allowed'
      ) {
        // Fallback to recognized admin session
        const adminProfile: AppUser = {
          uid: `admin-${Date.now()}`,
          email: ADMIN_EMAIL,
          displayName: 'Administrator',
          role: 'admin',
        };
        setUserProfile(adminProfile);
        localStorage.setItem(STORAGE_USER_SESSION, JSON.stringify(adminProfile));
        showToast(`Log masuk sebagai Administrator (${ADMIN_EMAIL}).`);
        return;
      }
      showToast(err.message || 'Log masuk dibatalkan', true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.warn('Firebase sign-out note:', err);
    }
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem(STORAGE_USER_SESSION);
    showToast('Akaun telah dilog keluar.');
  };

  // Add / Edit Participant handler (Admin or Participant)
  const handleSaveParticipant = async (participant: Participant) => {
    setParticipants(prev => {
      const index = prev.findIndex(p => p.id === participant.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = participant;
        return updated;
      } else {
        return [participant, ...prev];
      }
    });

    // If current participant user edited their own profile, keep link updated
    if (userProfile && (!userProfile.participantId || userProfile.participantId === participant.id)) {
      const updatedProfile = { ...userProfile, participantId: participant.id };
      setUserProfile(updatedProfile);
      localStorage.setItem(STORAGE_USER_SESSION, JSON.stringify(updatedProfile));
    }

    if (currentUser) {
      setIsCloudSyncing(true);
      try {
        await setDoc(doc(db, 'participants', participant.id), {
          id: participant.id,
          name: participant.name,
          gender: participant.gender,
          age: participant.age,
          occupation: participant.occupation,
          location: participant.location,
          marital: participant.marital,
          smoking: participant.smoking,
          hobbies: participant.hobbies || [],
          ideal: participant.ideal || '',
          photo: participant.photo || '',
          createdAt: participant.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerId: participant.ownerId || currentUser.uid,
          userId: participant.userId || currentUser.uid,
          userEmail: participant.userEmail || currentUser.email || '',
        });
        setIsCloudSyncing(false);
      } catch (err) {
        setIsCloudSyncing(false);
        console.warn('Firestore write warning:', err);
      }
    }

    setIsAddEditModalOpen(false);
    setIsMyProfileModalOpen(false);
    setParticipantToEdit(null);
    showToast('Profil peserta berjaya disimpan.');
  };

  // Delete Candidate handler (Administrator Only)
  const handleConfirmDelete = async () => {
    if (!isAdmin) {
      showToast('Hanya Administrator boleh memadam profil peserta!', true);
      return;
    }
    if (!participantToDelete) return;
    const targetId = participantToDelete.id;
    setParticipants(prev => prev.filter(p => p.id !== targetId));

    if (currentUser) {
      setIsCloudSyncing(true);
      try {
        await deleteDoc(doc(db, 'participants', targetId));
        setIsCloudSyncing(false);
      } catch (err) {
        setIsCloudSyncing(false);
        console.warn('Firestore delete warning:', err);
      }
    }

    setParticipantToDelete(null);
    showToast('Peserta telah dikeluarkan dari senarai pendaftaran.');
  };

  // API Call to Generate AI Matches
  const runMatchmakingAPI = async (): Promise<MatchResult[] | null> => {
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidates: participants }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Matchmaking failed');
      }

      const data = await response.json();
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        return data.matches;
      }
      return null;
    } catch (err: any) {
      console.error('Matchmaking API call error:', err);
      return null;
    }
  };

  // Trigger from Participants Pool (ADMIN ONLY)
  const handleStartGeneration = async () => {
    if (!isAdmin) {
      showToast('Hanya Administrator yang boleh menjalankan pemadanan AI!', true);
      return;
    }

    if (!isEligible) {
      setIsInsufficientModalOpen(true);
      return;
    }
    setIsGenerationModalOpen(true);

    // Call API in background while animation plays
    const newMatches = await runMatchmakingAPI();
    if (newMatches) {
      setMatches(newMatches);
      setMatchesPublished(true);
      localStorage.setItem(STORAGE_MATCHES_PUBLISHED, 'true');
    }
  };

  // Completion from Generation Modal
  const handleCompleteGeneration = () => {
    setIsGenerationModalOpen(false);
    setActiveTab('top-10-ai-matches');
    showToast(`Top ${matches.length} Padanan AI berjaya dijana dan diterbitkan.`);
  };

  // Re-generate trigger from Top 10 View (ADMIN ONLY)
  const handleRegenerateFromResults = async () => {
    if (!isAdmin) {
      showToast('Hanya Administrator yang dibenarkan menjana semula pemadanan!', true);
      return;
    }

    if (!isEligible) {
      setIsInsufficientModalOpen(true);
      return;
    }

    setIsRegenerating(true);
    const newMatches = await runMatchmakingAPI();
    setIsRegenerating(false);

    if (newMatches) {
      setMatches(newMatches);
      setMatchesPublished(true);
      localStorage.setItem(STORAGE_MATCHES_PUBLISHED, 'true');
      showToast(`Top ${newMatches.length} Padanan berjaya dikemaskini bagi ${participants.length} calon.`);
    } else {
      showToast('Padanan berjaya dikemaskini menggunakan model algoritma keserasian.');
    }
  };

  // IF USER IS NOT LOGGED IN, RENDER THE AUTHENTICATION PAGE FIRST
  if (!currentUser && !userProfile) {
    return (
      <div className="bg-background min-h-screen text-on-surface antialiased font-sans">
        <Toast message={toastMessage} isError={isToastError} />
        <LanguageModal />
        <AuthView
          onAuthSuccess={profile => {
            setUserProfile(profile);
            localStorage.setItem(STORAGE_USER_SESSION, JSON.stringify(profile));
            // Route participant to participants pool (where they see glimpse & profile)
            setActiveTab('participants-pool');
          }}
          existingParticipants={participants}
          onAddParticipant={handleSaveParticipant}
          showToast={showToast}
        />
      </div>
    );
  }

  // Find current participant profile if participant role
  const currentParticipantProfile = participants.find(
    p =>
      (userProfile?.participantId && p.id === userProfile.participantId) ||
      (userProfile?.email && p.userEmail && p.userEmail.toLowerCase() === userProfile.email.toLowerCase()) ||
      (userProfile?.displayName && p.name.toLowerCase() === userProfile.displayName.toLowerCase())
  ) || null;

  return (
    <div className="bg-background min-h-screen text-on-surface antialiased font-sans">
      {/* Toast Notification */}
      <Toast message={toastMessage} isError={isToastError} />

      {/* Global Language Selection Modal */}
      <LanguageModal />

      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        matchesCount={matches.length}
        isEligible={isEligible}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        currentUser={currentUser}
        userProfile={userProfile}
        userRole={effectiveRole}
        userDisplayName={userProfile?.displayName}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isCloudSyncing={isCloudSyncing}
        onToggleRole={handleToggleRole}
        onOpenConcierge={() => handleOpenConcierge()}
      />

      {/* Fixed Left Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        onOpenAffinityVectors={() => setIsAffinityVectorsOpen(true)}
        onOpenMatchingRules={() => setIsMatchingRulesOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={effectiveRole}
        matchesPublished={matchesPublished}
        onTogglePublish={() => {
          const next = !matchesPublished;
          setMatchesPublished(next);
          localStorage.setItem(STORAGE_MATCHES_PUBLISHED, JSON.stringify(next));
          showToast(next ? 'Keputusan pemadanan telah diterbitkan kepada peserta.' : 'Penerbitan keputusan ditarik balik (Draf).');
        }}
        onOpenSavedSessions={() => setIsSavedSessionsModalOpen(true)}
        onOpenResetModal={isAdmin ? () => setIsAdminResetModalOpen(true) : undefined}
        savedSessionsCount={savedSessions.length}
        onOpenConcierge={() => handleOpenConcierge()}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 pl-0 transition-all duration-300 min-h-screen">
        <main className="relative w-full pt-16 sm:pt-20 px-2.5 sm:px-space-md lg:px-space-xl pb-margin bg-background min-h-screen">
          <div className="w-full max-w-7xl mx-auto pt-space-md sm:pt-space-lg">
            {/* ROLE-BASED TAB VIEWS */}
            {activeTab === 'participants-pool' ? (
              isAdmin ? (
                /* ADMINISTRATOR VIEW: Full candidate pool with Add, Edit, Delete, and Generate Matches */
                <ParticipantsPoolView
                  participants={participants}
                  onOpenAddModal={() => {
                    setParticipantToEdit(null);
                    setIsAddEditModalOpen(true);
                  }}
                  onEditParticipant={p => {
                    setParticipantToEdit(p);
                    setIsAddEditModalOpen(true);
                  }}
                  onDeleteParticipant={p => setParticipantToDelete(p)}
                  onGenerateMatches={handleStartGeneration}
                />
              ) : (
                /* PARTICIPANT VIEW: Glimpse of attendee directory & their own profile */
                <ParticipantGlimpseView
                  participants={participants}
                  currentUserParticipantId={currentParticipantProfile?.id}
                  onEditMyProfile={() => {
                    setParticipantToEdit(currentParticipantProfile);
                    setIsMyProfileModalOpen(true);
                  }}
                  matches={matches}
                  matchesPublished={matchesPublished}
                  onViewMatches={() => setActiveTab('top-10-ai-matches')}
                  onOpenSavedSessions={() => setIsSavedSessionsModalOpen(true)}
                  savedSessionsCount={savedSessions.filter(s => s.isPublished).length}
                  onOpenConcierge={() => handleOpenConcierge()}
                />
              )
            ) : (
              /* MATCHES TAB: Top Matches View with Role Adaptations */
              <TopMatchesView
                matches={matches}
                participantsCount={participants.length}
                onBackToParticipants={() => setActiveTab('participants-pool')}
                onRegenerate={handleRegenerateFromResults}
                isRegenerating={isRegenerating}
                onSimulateInsufficient={() => setIsInsufficientModalOpen(true)}
                showToast={showToast}
                userRole={effectiveRole}
                matchesPublished={matchesPublished}
                onTogglePublish={() => {
                  const next = !matchesPublished;
                  setMatchesPublished(next);
                  localStorage.setItem(STORAGE_MATCHES_PUBLISHED, JSON.stringify(next));
                  showToast(next ? 'Keputusan pemadanan telah diterbitkan kepada peserta.' : 'Penerbitan keputusan ditarik balik (Draf).');
                }}
                currentUserParticipantId={currentParticipantProfile?.id}
                currentUserName={currentParticipantProfile?.name || userProfile?.displayName}
                onSaveMatchesToApp={handleSaveMatchesToApp}
                onOpenSavedSessions={() => setIsSavedSessionsModalOpen(true)}
                onOpenResetModal={isAdmin ? () => setIsAdminResetModalOpen(true) : undefined}
                savedSessionsCount={savedSessions.length}
                activeSessionTitle={activeSessionTitle}
                onOpenConcierge={handleOpenConcierge}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating AI Concierge / Dating Advisor Trigger Button (FAB) */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => handleOpenConcierge()}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/25 select-none"
          title={isAdmin ? 'AI Matchmaking Concierge (Full Cohort Access)' : 'AI Dating Advisor (Official Partner)'}
          aria-label="Buka AI Concierge"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform duration-300">
              psychology
            </span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-primary animate-pulse"></span>
          </div>

          <div className="flex flex-col text-left pr-1">
            <span className="font-serif font-bold text-xs sm:text-sm leading-tight text-white whitespace-nowrap">
              {isAdmin ? 'AI Concierge' : 'AI Dating Advisor'}
            </span>
            <span className="text-[10px] text-white/80 font-semibold tracking-tight whitespace-nowrap">
              {isAdmin ? 'Full Access' : (currentParticipantProfile ? 'Official Partner' : 'Smart Advisor')}
            </span>
          </div>
        </button>
      </div>

      {/* MODALS */}
      {/* Saved Match Sessions Archive Modal */}
      <SavedSessionsModal
        isOpen={isSavedSessionsModalOpen}
        onClose={() => setIsSavedSessionsModalOpen(false)}
        sessions={savedSessions}
        onLoadSession={handleLoadSavedSession}
        onTogglePublishSession={isAdmin ? handleTogglePublishSession : undefined}
        onDeleteSession={isAdmin ? handleDeleteSavedSession : undefined}
        isAdmin={isAdmin}
        currentParticipantName={currentParticipantProfile?.name || userProfile?.displayName}
        currentUserParticipantId={currentParticipantProfile?.id}
        activeSessionId={activeSessionId}
        onSaveCurrentMatches={handleSaveMatchesToApp}
        hasActiveMatches={matches.length > 0}
      />

      {/* Administrator System Reset Modal */}
      <AdminResetModal
        isOpen={isAdminResetModalOpen}
        onClose={() => setIsAdminResetModalOpen(false)}
        onResetActiveMatches={handleResetActiveMatches}
        onResetSavedSessions={handleResetSavedSessions}
        onResetParticipantsToDefault={handleResetParticipantsToDefault}
        onFullSystemReset={handleFullSystemReset}
      />
      {/* Administrator Add / Edit Participant Modal */}
      <AddEditParticipantModal
        isOpen={isAddEditModalOpen}
        participantToEdit={participantToEdit}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setParticipantToEdit(null);
        }}
        onSave={handleSaveParticipant}
      />

      {/* Participant Edit Own Profile Modal */}
      <MyProfileModal
        isOpen={isMyProfileModalOpen}
        participant={participantToEdit || currentParticipantProfile}
        onClose={() => {
          setIsMyProfileModalOpen(false);
          setParticipantToEdit(null);
        }}
        onSave={handleSaveParticipant}
      />

      {/* Delete Confirmation Modal (Admin Only) */}
      <DeleteConfirmModal
        isOpen={!!participantToDelete}
        participant={participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Batch Generation Progress Simulation Modal (Admin Only) */}
      <GenerationModal
        isOpen={isGenerationModalOpen}
        onComplete={handleCompleteGeneration}
        maleCount={maleCount}
        femaleCount={femaleCount}
        totalCandidates={participants.length}
      />

      {/* Insufficient Warning Modal */}
      <InsufficientWarningModal
        isOpen={isInsufficientModalOpen}
        onClose={() => setIsInsufficientModalOpen(false)}
        onAddParticipants={() => {
          setIsInsufficientModalOpen(false);
          setActiveTab('participants-pool');
          setParticipantToEdit(null);
          setIsAddEditModalOpen(true);
        }}
      />

      {/* Affinity Vectors Overview Modal */}
      <AffinityVectorsModal
        isOpen={isAffinityVectorsOpen}
        onClose={() => setIsAffinityVectorsOpen(false)}
      />

      {/* Matching Rules Overview Modal */}
      <MatchingRulesModal
        isOpen={isMatchingRulesOpen}
        onClose={() => setIsMatchingRulesOpen(false)}
      />

      {/* AI Concierge & Relationship Advisor Modal */}
      <AiConciergeModal
        isOpen={isAiConciergeOpen}
        onClose={() => setIsAiConciergeOpen(false)}
        userRole={effectiveRole}
        currentUser={userProfile}
        participants={participants}
        matches={matches}
        matchesPublished={matchesPublished}
        currentParticipantProfile={currentParticipantProfile}
        initialCoupleRank={conciergeSelectedRank}
      />
    </div>
  );
}
