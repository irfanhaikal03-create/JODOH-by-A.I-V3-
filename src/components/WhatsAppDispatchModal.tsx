import React, { useState, useEffect } from 'react';
import { Participant, MatchResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface WhatsAppDispatchTarget {
  participant?: Participant;
  match?: MatchResult;
  mode: 'single' | 'match';
}

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: WhatsAppDispatchTarget | null;
  onSuccess?: (msg: string) => void;
}

type TemplateType = 'match_announcement' | 'profile_reminder' | 'taaruf_invite' | 'custom';

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  target,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [template, setTemplate] = useState<TemplateType>('match_announcement');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<'male' | 'female' | 'single'>('single');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  // Clean phone number to international WhatsApp format (e.g. 60123456789)
  const formatPhoneForWhatsApp = (raw?: string): string => {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '60' + digits.substring(1);
    } else if (digits.startsWith('60')) {
      // Already has country code
    } else if (digits.length === 9 || digits.length === 10) {
      digits = '60' + digits;
    }
    return digits;
  };

  useEffect(() => {
    if (!isOpen || !target) return;

    if (target.mode === 'match' && target.match) {
      setSelectedRecipient('male');
      setTemplate('match_announcement');
    } else if (target.participant) {
      setSelectedRecipient('single');
      setTemplate('profile_reminder');
      setPhoneNumber(target.participant.phone || '0123456789');
    }
    setCopied(false);
  }, [isOpen, target]);

  // Update phone based on recipient in match mode
  useEffect(() => {
    if (target?.mode === 'match' && target.match) {
      if (selectedRecipient === 'male') {
        setPhoneNumber('012' + Math.floor(1000000 + Math.random() * 9000000));
      } else {
        setPhoneNumber('019' + Math.floor(1000000 + Math.random() * 9000000));
      }
    }
  }, [selectedRecipient, target]);

  if (!isOpen || !target) return null;

  const appUrl = window.location.origin;

  // Generate dynamic message content based on template
  const getGeneratedMessage = (): string => {
    if (template === 'custom') {
      return customMessage;
    }

    if (target.mode === 'match' && target.match) {
      const isMale = selectedRecipient === 'male';
      const recipientName = isMale ? target.match.maleName : target.match.femaleName;
      const partnerName = isMale ? target.match.femaleName : target.match.maleName;
      const partnerOcc = isMale ? target.match.femaleOccupation : target.match.maleOccupation;
      const partnerLoc = isMale ? target.match.femaleLocation : target.match.maleLocation;

      if (template === 'match_announcement') {
        return `Assalamu'alaikum wrt. wbt. ${recipientName},

Tahniah! Pihak penganjur Jodoh by AI ingin memaklumkan bahawa algoritma padanan kami telah menemui pasangan berpotensi tinggi untuk anda:

✨ Pasangan Cadangan: ${partnerName}
💼 Kerjaya: ${partnerOcc}
📍 Lokasi: ${partnerLoc}
🎯 Skor Keserasian AI: ${target.match.score}%
🌟 Titik Persamaan: ${target.match.whyTheyMatch.substring(0, 140)}...

Sila layari portal Jodoh by AI untuk menyemak profil penuh dan menyatakan persetujuan ta'aruf anda:
🔗 ${appUrl}

Sebarang pertanyaan, anda boleh hubungi Administrator terus melalui talian ini.
Terima kasih & selamat berikhtiar!`;
      }

      if (template === 'taaruf_invite') {
        return `Assalamu'alaikum wrt. wbt. ${recipientName},

Pihak penganjur Jodoh by AI ingin menjemput anda untuk menyertai Sesi Ta'aruf Terpelihara (Chaperoned Session) bersama ${partnerName}.

🗓️ Tarikh & Masa: Sila sahkan kelapangan anda
👥 Kehadiran: Anda dialu-alukan membawa bersama wakil / wali
🛡️ Format: Terkawal, bersopan dan memelihara syariat

Sila balas mesej ini untuk mengesahkan persetujuan anda.`;
      }
    }

    if (target.participant) {
      const p = target.participant;
      if (template === 'profile_reminder') {
        return `Assalamu'alaikum wrt. wbt. ${p.name},

Ini adalah peringatan mesra daripada Pengurusan Jodoh by AI. 

Bagi membolehkan sistem kecerdasan buatan (AI) memadankan anda dengan calon yang paling serasi mengikut kriteria pegangan hidup dan nilai peribadi anda, sila pastikan biodata serta kriteria pasangan idaman anda telah dikemas kini sepenuhnya.

Lengkapkan profil anda di sini:
🔗 ${appUrl}

Jazakumullahu Khair.`;
      }

      if (template === 'match_announcement') {
        return `Assalamu'alaikum wrt. wbt. ${p.name},

Pihak penganjur Jodoh by AI ingin memaklumkan bahawa keputusan pusingan padanan terkini telah diterbitkan di portal. 

Sila log masuk ke akaun anda untuk melihat calon berpotensi anda:
🔗 ${appUrl}`;
      }
    }

    return `Assalamu'alaikum wrt. wbt., Salam daripada Administrator Jodoh by AI. Sila log masuk ke ${appUrl} untuk maklumat lanjut.`;
  };

  const activeMessage = template === 'custom' ? customMessage : getGeneratedMessage();
  const cleanedPhone = formatPhoneForWhatsApp(phoneNumber);

  const handleOpenWhatsApp = () => {
    if (!cleanedPhone) {
      alert('Sila masukkan nombor telefon yang sah (contoh: 0123456789)');
      return;
    }
    const encodedText = encodeURIComponent(activeMessage);
    const waUrl = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (onSuccess) {
      onSuccess(`Pautan WhatsApp dibuka untuk ${cleanedPhone}`);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(activeMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onSuccess) onSuccess('Mesej berjaya disalin ke papan keratan.');
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent("Makluman Rasmi: Jodoh by AI Portal");
    const body = encodeURIComponent(activeMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with WhatsApp Green Branding */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-2xl text-white">chat</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg leading-tight">
                Pusat Makluman WhatsApp & Emel
              </h3>
              <p className="text-xs text-white/85 font-medium">
                Hantar mesej rasmi, padanan, atau jemputan ta'aruf terus ke telefon peserta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-on-surface text-sm">
          {/* Recipient Selection for Match mode */}
          {target.mode === 'match' && target.match && (
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
                Pilih Penerima Mesej:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecipient('male')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedRecipient === 'male'
                      ? 'bg-primary-container text-on-primary border-primary font-bold shadow-xs'
                      : 'bg-surface-container text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-blue-500">man</span>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{target.match.maleName}</p>
                    <p className="text-[10px] opacity-80">{target.match.maleOccupation}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRecipient('female')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedRecipient === 'female'
                      ? 'bg-primary-container text-on-primary border-primary font-bold shadow-xs'
                      : 'bg-surface-container text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base text-pink-500">woman</span>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{target.match.femaleName}</p>
                    <p className="text-[10px] opacity-80">{target.match.femaleOccupation}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Single Participant Info */}
          {target.mode === 'single' && target.participant && (
            <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                {target.participant.photo ? (
                  <img src={target.participant.photo} alt={target.participant.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  target.participant.name[0]
                )}
              </div>
              <div className="truncate flex-1">
                <p className="font-bold text-sm text-on-surface truncate">{target.participant.name}</p>
                <p className="text-xs text-outline">
                  {target.participant.occupation} • {target.participant.location} ({target.participant.age} thn)
                </p>
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
              Jenis Mesej / Templat:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('match_announcement')}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  template === 'match_announcement'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                    : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                💌 Makluman Padanan
              </button>

              <button
                type="button"
                onClick={() => setTemplate('taaruf_invite')}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  template === 'taaruf_invite'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                    : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                ☕ Jemputan Ta'aruf
              </button>

              <button
                type="button"
                onClick={() => setTemplate('profile_reminder')}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  template === 'profile_reminder'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                    : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                📋 Peringatan Profil
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplate('custom');
                  if (!customMessage) setCustomMessage(activeMessage);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  template === 'custom'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                    : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                ✍️ Mesej Bebas (Edit)
              </button>
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1.5">
              Nombor Telefon WhatsApp Penerima:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">
                call
              </span>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="cth: 012-3456789 atau 60123456789"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 focus:border-emerald-500 focus:outline-none text-xs sm:text-sm font-mono text-on-surface"
              />
            </div>
            <p className="text-[11px] text-outline mt-1">
              Format WhatsApp antarabangsa: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">+{cleanedPhone || '60...'}</span>
            </p>
          </div>

          {/* Message Content Preview / Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wider">
                Pratonton Mesej:
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Disalin!' : 'Salin Mesej'}
              </button>
            </div>

            <textarea
              rows={7}
              value={template === 'custom' ? customMessage : activeMessage}
              onChange={e => {
                if (template !== 'custom') setTemplate('custom');
                setCustomMessage(e.target.value);
              }}
              className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:border-emerald-500 focus:outline-none text-xs sm:text-sm text-on-surface font-sans leading-relaxed resize-none shadow-inner"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hantar melalui aplikasi Emel"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>Emel</span>
            </button>
            
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'done' : 'content_copy'}
              </span>
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface transition-all cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>Buka WhatsApp Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
