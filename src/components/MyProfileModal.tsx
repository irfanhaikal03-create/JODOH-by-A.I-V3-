import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  onSave: (updatedParticipant: Participant) => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  participant,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [age, setAge] = useState<number>(26);
  const [occupation, setOccupation] = useState('');
  const [location, setLocation] = useState('Kuala Lumpur');
  const [marital, setMarital] = useState<'Single' | 'Divorced' | 'Widowed'>('Single');
  const [smoking, setSmoking] = useState<'Non-Smoker' | 'Smoker'>('Non-Smoker');
  const [hobbiesStr, setHobbiesStr] = useState('');
  const [ideal, setIdeal] = useState('');
  const [photo, setPhoto] = useState('');
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process uploaded image file across multiple formats
  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (!result) return;

      if (file.type.includes('svg')) {
        setPhoto(result);
        return;
      }

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
          setPhoto(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          setPhoto(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (participant) {
      setName(participant.name || '');
      setGender(participant.gender || 'Female');
      setAge(participant.age || 26);
      setOccupation(participant.occupation || '');
      setLocation(participant.location || 'Kuala Lumpur');
      setMarital(participant.marital || 'Single');
      setSmoking(participant.smoking || 'Non-Smoker');
      setHobbiesStr(
        Array.isArray(participant.hobbies)
          ? participant.hobbies.join(', ')
          : participant.hobbies || ''
      );
      setIdeal(participant.ideal || '');
      setPhoto(participant.photo || '');
    }
  }, [participant]);

  if (!isOpen || !participant) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hobbiesArr = hobbiesStr
      .split(/[,;\n]+/)
      .map(h => h.trim())
      .filter(Boolean);

    const updated: Participant = {
      ...participant,
      name: name.trim(),
      gender,
      age: Number(age) || 25,
      occupation: occupation.trim() || 'Profesional',
      location: location.trim() || 'Kuala Lumpur',
      marital,
      smoking,
      hobbies: hobbiesArr.length > 0 ? hobbiesArr : ['Membaca', 'Kopi', 'Melancong'],
      ideal: ideal.trim() || 'Pasangan yang memahami dan bertanggungjawab.',
      photo: photo.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20 bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">account_circle</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-on-surface">Kemaskini Profil Saya</h3>
              <p className="text-xs text-on-surface-variant">Maklumat suai kenal yang dipaparkan kepada peserta lain.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Nama Penuh
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Umur (Tahun)
              </label>
              <input
                type="number"
                min={18}
                max={90}
                required
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Jantina
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Female">Perempuan (Female)</option>
                <option value="Male">Lelaki (Male)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Lokasi / Negeri
              </label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Pekerjaan
              </label>
              <input
                type="text"
                required
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
                placeholder="cth: Jurutera Perisian / Pensyarah"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                Taraf Perkahwinan
              </label>
              <select
                value={marital}
                onChange={e => setMarital(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Single">Bujang (Single)</option>
                <option value="Divorced">Pernah Berkahwin (Divorced)</option>
                <option value="Widowed">Kematian Pasangan (Widowed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
              Tabiat Merokok
            </label>
            <select
              value={smoking}
              onChange={e => setSmoking(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Non-Smoker">Tidak Merokok (Non-Smoker)</option>
              <option value="Smoker">Merokok (Smoker)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
              Hobi & Minat (Asingkan dengan koma)
            </label>
            <input
              type="text"
              value={hobbiesStr}
              onChange={e => setHobbiesStr(e.target.value)}
              placeholder="cth: Fotografi, Mendaki, Melukis, Kopi"
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
              Kriteria Pasangan Idaman & Nilai Peribadi
            </label>
            <textarea
              rows={3}
              value={ideal}
              onChange={e => setIdeal(e.target.value)}
              placeholder="Gambarkan pasangan yang anda cari..."
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Photo Section with Multi-format File Upload & URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-outline uppercase tracking-wider">
                Foto Profil
              </label>
              <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/30 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUploadMode('upload')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    uploadMode === 'upload'
                      ? 'bg-primary text-on-primary shadow-2xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  📁 Muat Naik Fail
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    uploadMode === 'url'
                      ? 'bg-primary text-on-primary shadow-2xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  🔗 Pautan URL
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.bmp,.heic,.heif"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  handleProcessFile(file);
                  e.target.value = '';
                }
              }}
            />

            {photo ? (
              <div className="p-3 rounded-xl bg-surface-container-low border border-primary/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={photo}
                    alt="Pratonton Profil"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/30 shadow-xs shrink-0 bg-surface-container"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate">
                      Foto Profil Aktif
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      Imej sedia untuk disimpan
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {uploadMode === 'upload' ? (
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
                      onClick={() => setPhoto('')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer"
                    >
                      Edit URL
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                    title="Padam Foto"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ) : uploadMode === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessFile(file);
                }}
                className={`w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container hover:border-primary/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    Klik untuk pilih atau seret foto ke sini
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Menyokong JPG, PNG, WEBP, GIF, AVIF, SVG (Maks. 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <input
                type="url"
                value={photo}
                onChange={e => setPhoto(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 transition-all shadow-sm cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
