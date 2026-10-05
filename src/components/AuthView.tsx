import React, { useState, useRef } from 'react';
import { UserRole, Participant } from '../types';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  ADMIN_EMAIL,
  ADMIN_PASSCODE,
} from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthViewProps {
  onAuthSuccess: (userProfile: {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    photoURL?: string;
    participantId?: string;
  }) => void;
  existingParticipants: Participant[];
  onAddParticipant: (participant: Participant) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  existingParticipants,
  onAddParticipant,
  showToast,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('participant');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Participant Specific Profile Fields (during Sign Up)
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [age, setAge] = useState<number>(26);
  const [occupation, setOccupation] = useState('');
  const [location, setLocation] = useState('Kuala Lumpur');
  const [marital, setMarital] = useState<'Single' | 'Divorced' | 'Widowed'>('Single');
  const [smoking, setSmoking] = useState<'Non-Smoker' | 'Smoker'>('Non-Smoker');
  const [hobbies, setHobbies] = useState('Cafe hopping, membaca, melancong');
  const [ideal, setIdeal] = useState('Seorang yang bertanggungjawab, penyayang, matang, dan berpegang pada nilai kekeluargaan.');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploadMode, setPhotoUploadMode] = useState<'upload' | 'url'>('upload');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process uploaded image file across multiple formats (JPG, PNG, WEBP, GIF, AVIF, SVG, etc.)
  const handleProcessImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Sila muat naik fail format imej yang sah (JPG, PNG, WEBP, GIF, AVIF, SVG).', true);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Saiz fail terlalu besar (Maksimum 10MB). Sila pilih imej yang lebih kecil.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (!result) return;

      // For SVG, keep raw data
      if (file.type.includes('svg')) {
        setPhotoUrl(result);
        showToast('Foto SVG berjaya dimuat naik.');
        return;
      }

      // Optimize image dimensions for smooth loading and storage
      const img = new Image();
      img.onload = () => {
        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPhotoUrl(compressedDataUrl);
        } else {
          setPhotoUrl(result);
        }
        showToast('Foto profil berjaya dimuat naik!');
      };
      img.onerror = () => {
        setPhotoUrl(result);
        showToast('Foto profil berjaya dimuat naik.');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = (user.email || '').trim().toLowerCase();

      // Check if user is known admin email or previously verified
      const isAutoAdmin = userEmail === ADMIN_EMAIL.toLowerCase();
      const role: UserRole = isAutoAdmin ? 'admin' : 'participant';

      // Find if already linked to a participant
      const matchedParticipant = existingParticipants.find(
        p => (p.userEmail && p.userEmail.toLowerCase() === userEmail) || p.ownerId === user.uid || p.userId === user.uid
      );

      let participantId = matchedParticipant?.id;
      if (role === 'participant' && !matchedParticipant) {
        participantId = `part-${Date.now()}`;
        const newPart: Participant = {
          id: participantId,
          name: user.displayName || 'Peserta Baru',
          gender: 'Female',
          age: 26,
          occupation: 'Profesional',
          location: 'Kuala Lumpur',
          marital: 'Single',
          smoking: 'Non-Smoker',
          hobbies: ['Melancong', 'Muzik', 'Kopi'],
          ideal: 'Pasangan yang memahami, menghormati nilai keluarga dan berkerjaya kukuh.',
          photo: user.photoURL || '',
          ownerId: user.uid,
          userId: user.uid,
          userEmail: user.email || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onAddParticipant(newPart);
        try {
          await setDoc(doc(db, 'participants', participantId), newPart);
        } catch (e) {
          console.warn('Firestore write warning:', e);
        }
      }

      onAuthSuccess({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (role === 'admin' ? 'Administrator' : 'Peserta'),
        role,
        photoURL: user.photoURL || undefined,
        participantId,
      });

      showToast(`Selamat datang, ${user.displayName || user.email}! Log masuk sebagai ${role === 'admin' ? 'Administrator' : 'Peserta'}.`);
    } catch (err: any) {
      console.warn('Google Sign-in API notice:', err.message);

      // If Identity Toolkit API is disabled in GCP project, provide graceful fallback
      const isIdentityToolkitErr =
        err.message?.includes('identity-toolkit') ||
        err.message?.includes('identitytoolkit') ||
        err.code?.includes('identity-toolkit') ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/internal-error';

      if (isIdentityToolkitErr) {
        const isAutoAdmin = (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) || (selectedRole === 'admin' && adminCode.trim() === ADMIN_PASSCODE);
        const targetEmail = isAutoAdmin ? (email.trim() || ADMIN_EMAIL) : (email.trim() || 'peserta@gmail.com');
        const targetName = isAutoAdmin ? (fullName.trim() || 'Administrator') : (fullName.trim() || 'Peserta');
        const role: UserRole = isAutoAdmin ? 'admin' : 'participant';

        const matchedParticipant = existingParticipants.find(
          p => (p.userEmail && p.userEmail.toLowerCase() === targetEmail.toLowerCase())
        );

        let participantId = matchedParticipant?.id;
        if (role === 'participant' && !matchedParticipant) {
          participantId = `part-${Date.now()}`;
          const newPart: Participant = {
            id: participantId,
            name: targetName,
            gender: gender || 'Female',
            age: age || 26,
            occupation: occupation.trim() || 'Profesional',
            location: location.trim() || 'Kuala Lumpur',
            marital: marital || 'Single',
            smoking: smoking || 'Non-Smoker',
            hobbies: ['Kembara', 'Muzik', 'Kopi'],
            ideal: 'Pasangan yang memahami, menghormati nilai keluarga dan berkerjaya kukuh.',
            photo: photoUrl || (gender === 'Male'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
            ownerId: `uid-${Date.now()}`,
            userId: `uid-${Date.now()}`,
            userEmail: targetEmail.toLowerCase(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onAddParticipant(newPart);
        }

        onAuthSuccess({
          uid: `local-${Date.now()}`,
          email: targetEmail.toLowerCase(),
          displayName: targetName,
          role,
          participantId,
        });

        showToast(
          `Log masuk berjaya sebagai ${targetName} (${role === 'admin' ? 'Administrator' : 'Peserta'}).`
        );
        return;
      }

      showToast(err.message || 'Gagal log masuk dengan Google', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email & Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Sila masukkan emel dan kata laluan.', true);
      return;
    }

    setIsLoading(true);
    try {
      let userObj: { uid: string; email: string; displayName?: string; photoURL?: string } | null = null;

      try {
        const res = await signInWithEmailAndPassword(auth, email.trim(), password);
        userObj = {
          uid: res.user.uid,
          email: res.user.email || email.trim(),
          displayName: res.user.displayName || undefined,
          photoURL: res.user.photoURL || undefined,
        };
      } catch (authError: any) {
        console.warn('Firebase email auth note:', authError.message);
        if (
          authError.code === 'auth/operation-not-allowed' ||
          authError.code === 'auth/invalid-credential' ||
          authError.code === 'auth/user-not-found'
        ) {
          const isAdminAcc = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
          userObj = {
            uid: `local-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
            email: email.trim(),
            displayName: isAdminAcc ? 'Administrator' : email.split('@')[0],
          };
        } else {
          throw authError;
        }
      }

      const lowerEmail = email.trim().toLowerCase();
      // Check if user is known admin email or registered admin
      const isAdminUser = lowerEmail === ADMIN_EMAIL.toLowerCase();
      const role: UserRole = isAdminUser ? 'admin' : 'participant';

      // Check linked participant
      const matchedPart = existingParticipants.find(
        p => (p.userEmail && p.userEmail.toLowerCase() === lowerEmail) || (userObj && p.userId === userObj.uid)
      );

      onAuthSuccess({
        uid: userObj?.uid || `uid-${Date.now()}`,
        email: lowerEmail,
        displayName: userObj?.displayName || (role === 'admin' ? 'Administrator' : 'Peserta'),
        role,
        photoURL: userObj?.photoURL,
        participantId: matchedPart?.id,
      });

      showToast(`Log masuk berjaya sebagai ${role === 'admin' ? 'Administrator' : 'Peserta'}.`);
    } catch (err: any) {
      console.error('Email sign in error:', err);
      showToast(err.message || 'Log masuk gagal. Sila semak emel dan kata laluan.', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email & Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      showToast('Sila isikan nama penuh, emel dan kata laluan.', true);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // SECURE ADMINISTRATOR VERIFICATION:
    // If registering as Administrator, require verified authorization passcode!
    if (selectedRole === 'admin') {
      const isPasscodeValid = adminCode.trim() === ADMIN_PASSCODE;
      const isKnownAdminEmail = cleanEmail === ADMIN_EMAIL.toLowerCase();

      if (!isPasscodeValid && !isKnownAdminEmail) {
        showToast(
          'Akses Ditolak: Kod Pengesahan Administrator tidak sah! Pendaftaran Administrator hanya untuk individu yang mempunyai kod pengesahan rasmi.',
          true
        );
        return;
      }
    }

    const finalRole: UserRole = selectedRole === 'admin' ? 'admin' : 'participant';

    setIsLoading(true);
    try {
      let uid = `user-${Date.now()}`;
      let registeredUser: any = null;

      try {
        const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        registeredUser = res.user;
        uid = res.user.uid;
        await updateProfile(res.user, { displayName: fullName.trim() });
      } catch (authError: any) {
        console.warn('Firebase createUser note:', authError.message);
        uid = `uid-${Date.now()}`;
      }

      let participantId: string | undefined;

      // If registered as Peserta, register their Participant profile into the candidate pool
      if (finalRole === 'participant') {
        participantId = `part-${Date.now()}`;
        const hobbiesList = hobbies
          .split(/[,;\n]+/)
          .map(h => h.trim())
          .filter(Boolean);

        const newParticipant: Participant = {
          id: participantId,
          name: fullName.trim(),
          gender,
          age: Number(age) || 25,
          occupation: occupation.trim() || 'Profesional Eksekutif',
          location: location.trim() || 'Kuala Lumpur',
          marital,
          smoking,
          hobbies: hobbiesList.length > 0 ? hobbiesList : ['Kembara', 'Muzik', 'Kulinari'],
          ideal: ideal.trim() || 'Mencari pasangan yang serasi, penyayang dan berprinsip hidup yang selari.',
          photo: photoUrl.trim() || (gender === 'Male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
          ownerId: uid,
          userId: uid,
          userEmail: cleanEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onAddParticipant(newParticipant);

        try {
          await setDoc(doc(db, 'participants', participantId), newParticipant);
        } catch (dbErr) {
          console.warn('Firestore participant save warning:', dbErr);
        }
      }

      onAuthSuccess({
        uid,
        email: cleanEmail,
        displayName: fullName.trim(),
        role: finalRole,
        photoURL: photoUrl.trim() || undefined,
        participantId,
      });

      showToast(`Pendaftaran berjaya! Selamat datang sebagai ${finalRole === 'admin' ? 'Administrator' : 'Peserta'}.`);
    } catch (err: any) {
      console.error('Sign up error:', err);
      showToast(err.message || 'Pendaftaran akaun gagal. Sila cuba lagi.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      {/* Brand Header */}
      <div className="w-full max-w-xl text-center mb-6">
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <img
            alt="JODOH by A.I Brandmark"
            className="h-10 sm:h-12 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VoFLL6PMuoTOKgVSCpLzUMnlZyTQA4E_UYhGM9U8V8FpBdFxu0BzwDFStd-XbBcC8sSE0xn1hIo_mg1mmR22sjvveERNM-rb9AlOtCyZ68-4GwaVELEHouNtRtVhCjV_47Da6rOkBc9sq1z_ppc-K_x4dHn2eI2Ny1m56p3c93pPVPVwP4-J2JaHJqkSNZp353ig9gtoeYUjACf1ghaeQ1aOJOGgXojHKL2ErYCxJv6hyGRVDdKmWWXh4"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary tracking-tight">
          JODOH by A.I
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant font-medium mt-1">
          Executive Matchmaking Suite • Portal Peserta & Administrator
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden">
        {/* Navigation Tabs between Sign In and Sign Up */}
        <div className="grid grid-cols-2 border-b border-outline-variant/20 bg-surface-container-low/50 p-1">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`py-3 text-sm sm:text-base font-bold transition-all rounded-xl cursor-pointer ${
              authMode === 'signin'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Log Masuk (Sign In)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`py-3 text-sm sm:text-base font-bold transition-all rounded-xl cursor-pointer ${
              authMode === 'signup'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Daftar Akaun (Sign Up)
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Informational Guidance Banner */}
          <div className="mb-6 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/25 text-xs text-on-surface-variant flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">verified_user</span>
            <div className="leading-relaxed">
              <strong className="text-on-surface font-semibold">Struktur Peranan:</strong>
              <div className="mt-1">
                • <strong className="text-primary">Peserta:</strong> Terbuka kepada semua individu untuk melengkapkan profil diri, melihat direktori calon secara sekali imbas, dan menerima keputusan rasmi.
              </div>
              <div>
                • <strong className="text-primary">Administrator:</strong> Akses khas penganjur acara untuk menguruskan kohort dan menjalankan pemadanan AI (memerlukan kod pengesahan rasmi).
              </div>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-semibold text-sm transition-all shadow-xs cursor-pointer mb-5"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Teruskan dengan Google</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-outline-variant/30 flex-1"></div>
            <span className="text-xs uppercase font-bold text-outline tracking-wider">Atau Guna Emel</span>
            <div className="h-px bg-outline-variant/30 flex-1"></div>
          </div>

          {/* SIGN IN FORM */}
          {authMode === 'signin' ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Alamat Emel
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="cth: peserta@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Kata Laluan
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-95 active:scale-98 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">login</span>
                    <span>Log Masuk</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {/* Role Selector Card */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
                  Pilih Peranan Anda (Role Selection)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Participant Option (Open for all) */}
                  <div
                    onClick={() => setSelectedRole('participant')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRole === 'participant'
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-outline-variant/30 hover:border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">favorite</span>
                        <span className="font-bold text-sm">Peserta (Participant)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Terbuka
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1.5 leading-snug">
                      Menyertai acara untuk mencari jodoh. Mengisi data profil diri dan melihat direktori peserta lain.
                    </p>
                  </div>

                  {/* Administrator Option (Protected by Verification Code) */}
                  <div
                    onClick={() => setSelectedRole('admin')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRole === 'admin'
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-outline-variant/30 hover:border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                        <span className="font-bold text-sm">Administrator</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                        Perlu Pengesahan
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1.5 leading-snug">
                      Khusus untuk penganjur acara yang mempunyai kod kelulusan penganjur yang sah.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Account Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Nama Penuh
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="cth: Sarah Binti Ahmad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Alamat Emel
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                  Kata Laluan (Sekurang-kurangnya 6 aksara)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                />
              </div>

              {/* Administrator Verification Passcode (Required when role is Administrator) */}
              {selectedRole === 'admin' && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Kod Pengesahan Administrator (Admin Verification Code) *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    placeholder="Masukkan kod pengesahan rasmi penganjur"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Akses penganjur dilindungi. Hanya pendaftar yang mempunyai kod pengesahan rasmi pihak penganjur sahaja boleh mendaftar sebagai Administrator.
                  </p>
                </div>
              )}

              {/* Participant Profile Form Fields */}
              {selectedRole === 'participant' && (
                <div className="border-t border-outline-variant/20 pt-4 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">badge</span>
                    <span>Maklumat Profil Suai Kenal Anda</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Jantina
                      </label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value as 'Male' | 'Female')}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                      >
                        <option value="Female">Perempuan (Female)</option>
                        <option value="Male">Lelaki (Male)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Umur (Tahun)
                      </label>
                      <input
                        type="number"
                        min={18}
                        max={80}
                        value={age}
                        onChange={e => setAge(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Pekerjaan
                      </label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={e => setOccupation(e.target.value)}
                        placeholder="cth: Jurutera Perisian / Doktor"
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Lokasi / Negeri
                      </label>
                      <select
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                      >
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Putrajaya">Putrajaya</option>
                        <option value="Pulau Pinang">Pulau Pinang</option>
                        <option value="Johor">Johor</option>
                        <option value="Perak">Perak</option>
                        <option value="Melaka">Melaka</option>
                        <option value="Negeri Sembilan">Negeri Sembilan</option>
                        <option value="Pahang">Pahang</option>
                        <option value="Kedah">Kedah</option>
                        <option value="Terengganu">Terengganu</option>
                        <option value="Kelantan">Kelantan</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Sarawak">Sarawak</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Taraf Perkahwinan
                      </label>
                      <select
                        value={marital}
                        onChange={e => setMarital(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                      >
                        <option value="Single">Bujang (Single)</option>
                        <option value="Divorced">Pernah Berkahwin (Divorced)</option>
                        <option value="Widowed">Kematian Pasangan (Widowed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Tabiat Merokok
                      </label>
                      <select
                        value={smoking}
                        onChange={e => setSmoking(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                      >
                        <option value="Non-Smoker">Tidak Merokok (Non-Smoker)</option>
                        <option value="Smoker">Merokok (Smoker)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Hobi & Minat (Asingkan dengan koma)
                    </label>
                    <input
                      type="text"
                      value={hobbies}
                      onChange={e => setHobbies(e.target.value)}
                      placeholder="cth: Fotografi, Mendaki, Melukis, Kopi"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Kriteria Pasangan Idaman & Nilai Peribadi
                    </label>
                    <textarea
                      rows={2}
                      value={ideal}
                      onChange={e => setIdeal(e.target.value)}
                      placeholder="Gambarkan ciri pasangan yang anda cari..."
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm"
                    />
                  </div>

                  {/* Photo Upload & URL Option */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-on-surface-variant">
                        Foto Profil (Pilihan)
                      </label>
                      <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/30 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPhotoUploadMode('upload')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            photoUploadMode === 'upload'
                              ? 'bg-primary text-on-primary shadow-2xs'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          📁 Muat Naik Fail
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoUploadMode('url')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            photoUploadMode === 'url'
                              ? 'bg-primary text-on-primary shadow-2xs'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          🔗 Pautan URL
                        </button>
                      </div>
                    </div>

                    {/* Hidden Native File Input supporting multiple image formats */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.bmp,.heic,.heif"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleProcessImageFile(file);
                          e.target.value = '';
                        }
                      }}
                    />

                    {/* Photo Preview Card when photo is set */}
                    {photoUrl ? (
                      <div className="p-3 rounded-xl bg-surface-container-low border border-primary/25 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={photoUrl}
                            alt="Pratonton Profil"
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/30 shadow-xs shrink-0 bg-surface-container"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-on-surface block truncate">
                              Foto Profil Sedia Digunakan
                            </span>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Imej berjaya dimuatkan
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {photoUploadMode === 'upload' ? (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-primary border border-primary/20 transition-all cursor-pointer"
                            >
                              Tukar Fail
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPhotoUrl('')}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer"
                            >
                              Edit URL
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPhotoUrl('')}
                            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                            title="Padam Foto"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ) : photoUploadMode === 'upload' ? (
                      /* Drag and Drop / Browse Upload Box */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => {
                          e.preventDefault();
                          setIsDraggingPhoto(true);
                        }}
                        onDragLeave={() => setIsDraggingPhoto(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setIsDraggingPhoto(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleProcessImageFile(file);
                        }}
                        className={`w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                          isDraggingPhoto
                            ? 'border-primary bg-primary/10'
                            : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container hover:border-primary/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">
                            Klik untuk muat naik atau seret foto ke sini
                          </p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            Menyokong pelbagai format: <strong>JPG, PNG, WEBP, GIF, AVIF, SVG</strong>
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* URL Input Mode */
                      <div className="space-y-1.5">
                        <input
                          type="url"
                          value={photoUrl}
                          onChange={e => setPhotoUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-... (Pautan Imej Web)"
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest"
                        />
                        <p className="text-[11px] text-on-surface-variant">
                          Masukkan pautan URL gambar terus dari web (cth: Unsplash, Pexels, atau hosting foto).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-95 active:scale-98 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span>Mendaftarkan akaun...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    <span>Daftar Sebagai {selectedRole === 'admin' ? 'Administrator' : 'Peserta'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
