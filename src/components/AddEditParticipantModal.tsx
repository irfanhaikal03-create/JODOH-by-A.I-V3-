import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';

interface AddEditParticipantModalProps {
  isOpen: boolean;
  participantToEdit: Participant | null;
  onClose: () => void;
  onSave: (participant: Participant) => void;
}

export const AddEditParticipantModal: React.FC<AddEditParticipantModalProps> = ({
  isOpen,
  participantToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [age, setAge] = useState<number | ''>(28);
  const [marital, setMarital] = useState<'Single' | 'Divorced' | 'Widowed'>('Single');
  const [smoking, setSmoking] = useState<'Non-Smoker' | 'Smoker'>('Non-Smoker');
  const [occupation, setOccupation] = useState('');
  const [location, setLocation] = useState('Kuala Lumpur');
  const [photo, setPhoto] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [ideal, setIdeal] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        // Optimize dimensions to 400x400 for crisp quality and lightweight storage
        const maxDim = 400;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhoto(dataUrl);
        } else {
          setPhoto(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (participantToEdit) {
      setName(participantToEdit.name);
      setGender(participantToEdit.gender);
      setAge(participantToEdit.age);
      setMarital(participantToEdit.marital);
      setSmoking(participantToEdit.smoking);
      setOccupation(participantToEdit.occupation);
      setLocation(participantToEdit.location);
      setPhoto(participantToEdit.photo || '');
      setHobbies(
        Array.isArray(participantToEdit.hobbies)
          ? participantToEdit.hobbies.join(', ')
          : participantToEdit.hobbies
      );
      setIdeal(participantToEdit.ideal);
    } else {
      setName('');
      setGender('Male');
      setAge(28);
      setMarital('Single');
      setSmoking('Non-Smoker');
      setOccupation('');
      setLocation('Kuala Lumpur');
      setPhoto('');
      setHobbies('');
      setIdeal('');
    }
    setErrors({});
  }, [participantToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'This field is required';
    }

    if (!age || Number(age) < 18 || Number(age) > 99) {
      newErrors.age = 'Valid age (18-99) is required';
    }

    if (!occupation.trim()) {
      newErrors.occupation = 'This field is required';
    }

    if (!hobbies.trim()) {
      newErrors.hobbies = 'Please enter at least one hobby or interest';
    }

    if (!ideal.trim()) {
      newErrors.ideal = 'Please provide ideal partner notes for AI analysis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const hobbiesArray = hobbies
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const savedParticipant: Participant = {
      ...(participantToEdit || {}),
      id: participantToEdit ? participantToEdit.id : `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      gender,
      age: Number(age),
      marital,
      smoking,
      occupation: occupation.trim(),
      location,
      photo: photo.trim() || undefined,
      hobbies: hobbiesArray,
      ideal: ideal.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedParticipant);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all border border-outline-variant/30">
        {/* Modal Header */}
        <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-2xl">badge</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif font-semibold">
                {participantToEdit ? 'Edit Candidate Profile' : 'Add Participant'}
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Candidate profile details for algorithm matching
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body (Scrollable Form) */}
        <form onSubmit={handleSubmit} className="p-space-lg overflow-y-auto space-y-space-md" noValidate>
          {/* Full Name & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Farhan Zainal"
                className={`w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest placeholder:text-outline/60 border ${
                  errors.name ? 'border-error ring-1 ring-error' : 'border-transparent'
                }`}
              />
              {errors.name && (
                <span className="text-error font-label-sm text-label-sm mt-1 block">
                  {errors.name}
                </span>
              )}
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Gender <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-2 gap-space-xs">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg cursor-pointer transition-all ${
                    gender === 'Male'
                      ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">man</span>
                  <span>Male</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg cursor-pointer transition-all ${
                    gender === 'Female'
                      ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">woman</span>
                  <span>Female</span>
                </button>
              </div>
            </div>
          </div>

          {/* Age, Marital, Smoking */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Age <span className="text-error">*</span>
              </label>
              <input
                type="number"
                min={18}
                max={99}
                value={age}
                onChange={e => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setAge(val);
                  if (errors.age) setErrors(prev => ({ ...prev, age: '' }));
                }}
                placeholder="e.g. 29"
                className={`w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest placeholder:text-outline/60 border ${
                  errors.age ? 'border-error ring-1 ring-error' : 'border-transparent'
                }`}
              />
              {errors.age && (
                <span className="text-error font-label-sm text-label-sm mt-1 block">
                  {errors.age}
                </span>
              )}
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Marital Status <span className="text-error">*</span>
              </label>
              <select
                value={marital}
                onChange={e => setMarital(e.target.value as any)}
                className="w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent cursor-pointer"
              >
                <option value="Single">Single</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Smoking Status <span className="text-error">*</span>
              </label>
              <select
                value={smoking}
                onChange={e => setSmoking(e.target.value as any)}
                className="w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent cursor-pointer"
              >
                <option value="Non-Smoker">Non-Smoker</option>
                <option value="Smoker">Smoker</option>
              </select>
            </div>
          </div>

          {/* Occupation & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Occupation <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={occupation}
                onChange={e => {
                  setOccupation(e.target.value);
                  if (errors.occupation) setErrors(prev => ({ ...prev, occupation: '' }));
                }}
                placeholder="e.g. Petroleum Engineer"
                className={`w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest placeholder:text-outline/60 border ${
                  errors.occupation ? 'border-error ring-1 ring-error' : 'border-transparent'
                }`}
              />
              {errors.occupation && (
                <span className="text-error font-label-sm text-label-sm mt-1 block">
                  {errors.occupation}
                </span>
              )}
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                Location / State <span className="text-error">*</span>
              </label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent cursor-pointer"
              >
                <option value="Kuala Lumpur">Kuala Lumpur</option>
                <option value="Selangor">Selangor</option>
                <option value="Penang">Penang</option>
                <option value="Johor">Johor</option>
                <option value="Perak">Perak</option>
                <option value="Sabah">Sabah</option>
                <option value="Sarawak">Sarawak</option>
                <option value="Melaka">Melaka</option>
              </select>
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                Profile Photo <span className="text-outline text-xs lowercase font-normal">(optional - stylized monogram used if blank)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlFallback(!showUrlFallback)}
                className="text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                {showUrlFallback ? 'Switch to file upload' : 'Or paste image link'}
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) processImageFile(file);
              }}
            />

            {showUrlFallback ? (
              /* URL fallback mode */
              <div className="flex items-center gap-space-sm">
                <input
                  type="url"
                  value={photo}
                  onChange={e => setPhoto(e.target.value)}
                  placeholder="https://example.com/candidate-photo.jpg"
                  className="flex-1 px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest placeholder:text-outline/60 border border-transparent"
                />
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="p-2 rounded-lg bg-surface-container text-outline hover:text-error transition-colors"
                    title="Clear photo"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            ) : photo ? (
              /* Attached Photo Preview State */
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/30">
                <div className="flex items-center gap-space-sm">
                  <img
                    src={photo}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover shadow-xs ring-1 ring-outline-variant/30"
                  />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                      Photo attached
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant">
                      Ready for profile card and pairing matrix
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="px-space-sm py-1.5 rounded-lg bg-error-container text-error font-label-sm text-label-sm font-semibold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop File Upload Zone */
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processImageFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-space-md rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none ${
                  isDragging
                    ? 'border-primary bg-primary-fixed/30'
                    : 'border-outline-variant/40 bg-surface-container-low/60 hover:bg-surface-container-low hover:border-primary/60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary mb-1 shadow-xs">
                  <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-label-md text-label-md text-primary font-bold">
                    Click to upload photo
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">or drag & drop</span>
                </div>
                <span className="font-body-sm text-xs text-outline mt-0.5">
                  PNG, JPG, or WebP (auto-optimized)
                </span>
              </div>
            )}
          </div>

          {/* Hobbies & Interests */}
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
              Hobbies & Interests <span className="text-error">*</span>{' '}
              <span className="text-outline text-xs lowercase font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={hobbies}
              onChange={e => {
                setHobbies(e.target.value);
                if (errors.hobbies) setErrors(prev => ({ ...prev, hobbies: '' }));
              }}
              placeholder="e.g. Specialty Coffee, Trail Running, Architecture"
              className={`w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest placeholder:text-outline/60 border ${
                errors.hobbies ? 'border-error ring-1 ring-error' : 'border-transparent'
              }`}
            />
            {errors.hobbies && (
              <span className="text-error font-label-sm text-label-sm mt-1 block">
                {errors.hobbies}
              </span>
            )}
          </div>

          {/* Ideal Partner Criteria */}
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
              Target / Ideal Partner Dynamics <span className="text-error">*</span>
            </label>
            <textarea
              rows={3}
              value={ideal}
              onChange={e => {
                setIdeal(e.target.value);
                if (errors.ideal) setErrors(prev => ({ ...prev, ideal: '' }));
              }}
              placeholder="Describe values, personality temperament, life vision, communication preferences..."
              className={`w-full px-space-md py-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest placeholder:text-outline/60 resize-none border ${
                errors.ideal ? 'border-error ring-1 ring-error' : 'border-transparent'
              }`}
            />
            {errors.ideal && (
              <span className="text-error font-label-sm text-label-sm mt-1 block">
                {errors.ideal}
              </span>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-space-md bg-surface-container-low -mx-space-lg -mb-space-lg px-space-lg py-space-md flex items-center justify-end gap-space-sm border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-90 transition-all font-bold cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
