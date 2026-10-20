import React, { useMemo } from 'react';
import { Participant, MatchResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AdminInsightsViewProps {
  participants: Participant[];
  matches: MatchResult[];
  onOpenManualMatchmaker: (preselectedParticipantId?: string) => void;
  onOpenWhatsAppDispatch: (participant: Participant) => void;
  onBackToDirectory: () => void;
}

export const AdminInsightsView: React.FC<AdminInsightsViewProps> = ({
  participants,
  matches,
  onOpenManualMatchmaker,
  onOpenWhatsAppDispatch,
  onBackToDirectory,
}) => {
  const { t } = useLanguage();

  // Metrics computation
  const metrics = useMemo(() => {
    const total = participants.length;
    const males = participants.filter(p => p.gender === 'Male');
    const females = participants.filter(p => p.gender === 'Female');
    const maleCount = males.length;
    const femaleCount = females.length;
    const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
    const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;

    const avgAge = total > 0 ? (participants.reduce((sum, p) => sum + p.age, 0) / total).toFixed(1) : '0';
    const avgScore = matches.length > 0 ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length) : 0;

    // Set of matched participant IDs
    const matchedIds = new Set<string>();
    matches.forEach(m => {
      matchedIds.add(m.maleId);
      matchedIds.add(m.femaleId);
    });

    const matchedCount = Array.from(matchedIds).filter(id => participants.some(p => p.id === id)).length;
    const matchCoveragePercent = total > 0 ? Math.round((matchedCount / total) * 100) : 0;

    // Age brackets
    const ageGroups: Record<string, number> = {
      '20-25': 0,
      '26-30': 0,
      '31-35': 0,
      '36-40': 0,
      '41+': 0,
    };
    participants.forEach(p => {
      if (p.age <= 25) ageGroups['20-25']++;
      else if (p.age <= 30) ageGroups['26-30']++;
      else if (p.age <= 35) ageGroups['31-35']++;
      else if (p.age <= 40) ageGroups['36-40']++;
      else ageGroups['41+']++;
    });

    // Locations breakdown
    const locations: Record<string, number> = {};
    participants.forEach(p => {
      const loc = p.location?.trim() || 'Lain-lain';
      locations[loc] = (locations[loc] || 0) + 1;
    });

    // Marital breakdown
    const maritalCounts: Record<string, number> = { Single: 0, Divorced: 0, Widowed: 0 };
    participants.forEach(p => {
      if (maritalCounts[p.marital] !== undefined) maritalCounts[p.marital]++;
      else maritalCounts['Single']++;
    });

    // Smoker breakdown
    const nonSmokers = participants.filter(p => p.smoking === 'Non-Smoker').length;
    const smokers = participants.filter(p => p.smoking === 'Smoker').length;

    // Unmatched participants
    const unmatchedParticipants = participants.filter(p => !matchedIds.has(p.id));

    return {
      total,
      maleCount,
      femaleCount,
      malePercent,
      femalePercent,
      avgAge,
      avgScore,
      matchedCount,
      matchCoveragePercent,
      ageGroups,
      locations,
      maritalCounts,
      nonSmokers,
      smokers,
      unmatchedParticipants,
    };
  }, [participants, matches]);

  // AI Unmatched Gap Diagnostics
  const generateGapDiagnosis = (p: Participant) => {
    const isMale = p.gender === 'Male';
    const oppositeGenderCandidates = participants.filter(cand => cand.gender !== p.gender);

    // Analyze specific bottlenecks
    const issues: { title: string; desc: string; action: string; severity: 'high' | 'medium' }[] = [];

    // Bottleneck 1: Smoker deal-breaker
    if (p.smoking === 'Smoker') {
      const nonSmokerOpposite = oppositeGenderCandidates.filter(c => c.smoking === 'Non-Smoker').length;
      issues.push({
        title: 'Status Merokok (Deal-Breaker Utama)',
        desc: `${Math.round((nonSmokerOpposite / (oppositeGenderCandidates.length || 1)) * 100)}% calon wanita/lelaki dalam kohort meletakkan syarat tegas pasangan tidak merokok.`,
        action: 'Cadangkan perbincangan terbuka atau galakkan calon untuk nyatakan komitmen berhenti merokok.',
        severity: 'high',
      });
    }

    // Bottleneck 2: Age gap or strict ideal
    const suitableAge = oppositeGenderCandidates.filter(c => Math.abs(c.age - p.age) <= 4);
    if (suitableAge.length <= 2) {
      issues.push({
        title: 'Jurang Taburan Umur Kohort',
        desc: `Hanya ada ${suitableAge.length} calon lawan jantina dalam lingkungan umur ±4 tahun daripada umur calon (${p.age} tahun).`,
        action: 'Cadangkan calon mempertimbangkan kelonggaran perbezaan umur sehingga ±6-8 tahun.',
        severity: 'medium',
      });
    }

    // Bottleneck 3: Geographic isolation
    const sameLoc = oppositeGenderCandidates.filter(c => c.location.toLowerCase() === p.location.toLowerCase());
    if (sameLoc.length === 0) {
      issues.push({
        title: 'Lokasi Geografi Terhad',
        desc: `Tiada calon ${isMale ? 'wanita' : 'lelaki'} yang berdaftar dari ${p.location}. Majoriti berada di Lembah Klang / zon lain.`,
        action: 'Hubungi calon untuk bertanya kesediaan berpindah atau hubungan rentas negeri (long-distance ta\'aruf).',
        severity: 'high',
      });
    }

    // Bottleneck 4: Marital status compatibility
    if (p.marital !== 'Single') {
      issues.push({
        title: 'Penerimaan Status Perkahwinan',
        desc: `Sebagai ${p.marital === 'Divorced' ? 'Duda/Janda' : 'Balu'}, padanan memerlukan pasangan yang bersikap terbuka terhadap pengalaman hidup terdahulu.`,
        action: 'Gunakan Meja Kerja Padanan Manual untuk padankan dengan calon yang berfikiran matang.',
        severity: 'medium',
      });
    }

    // Fallback general diagnostic
    if (issues.length === 0) {
      issues.push({
        title: 'Kriteria Ideal & Gaya Hidup Khusus',
        desc: `Kenyataan pasangan idaman: "${p.ideal.substring(0, 100)}..." memerlukan sentuhan penyesuaian khusus daripada penganjur.`,
        action: 'Gunakan Meja Kerja Padanan Manual untuk semak skor keserasian terperinci.',
        severity: 'medium',
      });
    }

    return issues;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">monitoring</span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-on-surface">
              {t('adminInsightsTitle', 'Papan Pemuka Analitik & Wawasan AI')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-outline">
            Analisis demografi kohort peserta, kadar liputan padanan, dan AI Gap Analysis bagi calon yang belum berpadanan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Direktori Calon</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenManualMatchmaker()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-container hover:from-primary/90 hover:to-primary-container/90 shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">handshake</span>
            <span>Meja Kerja Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Candidates */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>Jumlah Calon</span>
            <span className="material-symbols-outlined text-lg text-primary">groups</span>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-on-surface">
            {metrics.total}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium">
            <span className="text-blue-600 dark:text-blue-400 font-bold">{metrics.maleCount} ♂</span>
            <span className="text-outline">•</span>
            <span className="text-pink-600 dark:text-pink-400 font-bold">{metrics.femaleCount} ♀</span>
          </div>
        </div>

        {/* Gender Ratio */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>Nisbah Jantina</span>
            <span className="material-symbols-outlined text-lg text-secondary">wc</span>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-on-surface">
            {metrics.malePercent}% <span className="text-xs text-outline font-sans font-normal">: {metrics.femalePercent}%</span>
          </p>
          {/* Visual Ratio Bar */}
          <div className="w-full h-2 rounded-full bg-pink-200 dark:bg-pink-950/60 overflow-hidden mt-3 flex">
            <div 
              className="bg-blue-500 h-full transition-all duration-500" 
              style={{ width: `${metrics.malePercent}%` }}
              title={`Lelaki: ${metrics.malePercent}%`}
            />
          </div>
        </div>

        {/* Average Age */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>Purata Umur</span>
            <span className="material-symbols-outlined text-lg text-amber-500">cake</span>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-on-surface">
            {metrics.avgAge} <span className="text-xs text-outline font-sans font-normal">tahun</span>
          </p>
          <p className="text-[11px] text-outline mt-2 font-medium">
            Kohort eksekutif & profesional muda
          </p>
        </div>

        {/* Average Match Score */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>Purata Skor AI</span>
            <span className="material-symbols-outlined text-lg text-emerald-500">auto_awesome</span>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.avgScore}%
          </p>
          <p className="text-[11px] text-outline mt-2 font-medium">
            {matches.length} pasangan aktif berdaftar
          </p>
        </div>

        {/* Match Coverage */}
        <div className="col-span-2 lg:col-span-1 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>Liputan Padanan</span>
            <span className="material-symbols-outlined text-lg text-primary">verified</span>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-on-surface">
            {metrics.matchCoveragePercent}%
          </p>
          <p className="text-[11px] text-outline mt-2 font-medium">
            {metrics.matchedCount} daripada {metrics.total} calon berpadanan
          </p>
        </div>
      </div>

      {/* Visual Demographic Distributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Age Groups Distribution */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-xs">
          <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
            <span>Taburan Lingkungan Umur</span>
          </h3>
          <div className="space-y-2.5">
            {Object.entries(metrics.ageGroups).map(([group, count]) => {
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              return (
                <div key={group} className="text-xs">
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-on-surface">{group} tahun</span>
                    <span className="text-outline">{count} calon ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic / State Breakdown */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-xs">
          <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">pin_drop</span>
            <span>Lokasi / Negeri Peserta</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {Object.entries(metrics.locations)
              .sort((a, b) => b[1] - a[1])
              .map(([loc, count]) => {
                const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                return (
                  <div key={loc} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all">
                    <span className="font-semibold text-on-surface truncate">{loc}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {count} orang
                      </span>
                      <span className="text-outline text-[11px] w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Marital & Lifestyle Attributes */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">favorite</span>
              <span>Status Perkahwinan & Merokok</span>
            </h3>

            {/* Marital */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs font-semibold">
                <span>Bujang:</span>
                <span className="text-primary font-bold">{metrics.maritalCounts['Single'] || 0} calon</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span>Duda / Janda:</span>
                <span className="text-secondary font-bold">{(metrics.maritalCounts['Divorced'] || 0) + (metrics.maritalCounts['Widowed'] || 0)} calon</span>
              </div>
            </div>

            <div className="border-t border-outline-variant/20 pt-3">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span>Bukan Perokok:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{metrics.nonSmokers} orang ({metrics.total > 0 ? Math.round((metrics.nonSmokers / metrics.total) * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span>Perokok:</span>
                <span className="text-rose-500 font-bold">{metrics.smokers} orang</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-outline">
            💡 <strong className="text-on-surface font-semibold">Tip AI:</strong> Majoriti peserta mencari pasangan bukan perokok dan bersedia untuk ta'aruf berteraskan nilai Islam.
          </div>
        </div>
      </div>

      {/* SECTION: AI UNMATCHED GAP ANALYSIS */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-outline-variant/20 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-sm">troubleshoot</span>
              <span>AI Unmatched Gap Analysis</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-on-surface">
              Analisis Jurang & Halangan Calon Belum Berpadanan ({metrics.unmatchedParticipants.length} Calon)
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Sistem AI menganalisis punca mengapa calon-calon ini belum mendapat padanan optimum dalam pusingan automatik, serta mencadangkan langkah intervensi buat penganjur.
            </p>
          </div>

          {metrics.unmatchedParticipants.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenManualMatchmaker(metrics.unmatchedParticipants[0]?.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-base">psychology</span>
              <span>Bantu Padankan Manual</span>
            </button>
          )}
        </div>

        {metrics.unmatchedParticipants.length === 0 ? (
          <div className="text-center py-10 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40">
            <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">celebration</span>
            <p className="font-serif font-bold text-base text-on-surface">
              Hebat! 100% Calon Berjaya Dipadankan
            </p>
            <p className="text-xs text-outline max-w-md mx-auto mt-1">
              Semua calon dalam direktori telah mempunyai pasangan aktif dalam pusingan padanan terkini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.unmatchedParticipants.map(participant => {
              const diagnostics = generateGapDiagnosis(participant);
              const isMale = participant.gender === 'Male';

              return (
                <div 
                  key={participant.id}
                  className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs"
                >
                  <div>
                    {/* Header: Photo + Info */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/40">
                        {participant.photo ? (
                          <img 
                            src={participant.photo} 
                            alt={participant.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-serif font-bold text-lg text-primary">
                            {participant.name[0]}
                          </div>
                        )}
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${isMale ? 'bg-blue-500' : 'bg-pink-500'}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-on-surface truncate">
                            {participant.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            isMale ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300'
                          }`}>
                            {participant.age} thn • {participant.gender === 'Male' ? 'Lelaki' : 'Wanita'}
                          </span>
                        </div>
                        <p className="text-xs text-outline mt-0.5 truncate">
                          {participant.occupation} • {participant.location}
                        </p>
                        <p className="text-[11px] text-outline font-medium mt-0.5">
                          Status: <strong className="text-on-surface">{participant.marital}</strong> | <strong className="text-on-surface">{participant.smoking}</strong>
                        </p>
                      </div>
                    </div>

                    {/* AI Diagnosis List */}
                    <div className="space-y-2 mb-4 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
                      <p className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-amber-500">warning</span>
                        <span>Analisis Halangan Padanan AI:</span>
                      </p>

                      {diagnostics.map((diag, idx) => (
                        <div key={idx} className="text-xs space-y-1">
                          <p className="font-bold text-on-surface flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{diag.title}</span>
                          </p>
                          <p className="text-[11px] text-outline leading-relaxed pl-2.5">
                            {diag.desc}
                          </p>
                          <div className="pl-2.5 pt-0.5">
                            <span className="inline-block text-[11px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-md">
                              👉 Tindakan: {diag.action}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => onOpenManualMatchmaker(participant.id)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-on-primary bg-primary hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">handshake</span>
                      <span>Cuba Padankan Manual</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppDispatch(participant)}
                      className="py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      title="Hubungi calon di WhatsApp"
                    >
                      <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">chat</span>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
