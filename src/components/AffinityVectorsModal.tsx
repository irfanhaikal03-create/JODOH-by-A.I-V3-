import React from 'react';

interface AffinityVectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffinityVectorsModal: React.FC<AffinityVectorsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const vectors = [
    {
      id: '01',
      title: 'Vector 01: Geographic Proxemics & Zone Radius',
      weight: '20% Weight',
      desc: 'Evaluates spatial feasibility and commute friction between candidate residential clusters in Klang Valley, Penang, and regional hubs.',
      status: '80% Same Zone Overlap',
      icon: 'share_location',
    },
    {
      id: '02',
      title: 'Vector 02: Communicative Temperament & Archetype Balance',
      weight: '25% Weight',
      desc: 'Matches exploratory extroverted initiators with reflective grounded discerners for high psychological safety and cognitive rapport.',
      status: '92% Complementary Balance',
      icon: 'psychology',
    },
    {
      id: '03',
      title: 'Vector 03: Lifestyle Cadence & Work Pacing',
      weight: '15% Weight',
      desc: 'Harmonizes demanding professional demands (residents, founders, counsels) against shared reverence for unhurried weekend rituals.',
      status: 'Active Pacing Safeguard',
      icon: 'schedule',
    },
    {
      id: '04',
      title: 'Vector 04: Ethical & Family Aspirations',
      weight: '30% Weight',
      desc: 'Evaluates deeply held personal values, moral endurance, cultural grounding, societal stewardship, and relational intentionality.',
      status: 'Highest Batch Concordance (98%)',
      icon: 'family_restroom',
    },
    {
      id: '05',
      title: 'Vector 05: Sensory Passions & Leisure Sync',
      weight: '10% Weight',
      desc: 'Calculates overlap across culinary exploration, tactile crafts, outdoor athletics, literature, and architectural aesthetics.',
      status: '9/10 Pairings Aligned',
      icon: 'outdoor_grill',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-outline-variant/30">
        <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif font-semibold">
                Affinity Vectors & Dimensional Weighting
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Algorithmic synthesis framework used by Jodoh by AI
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

        <div className="p-space-lg overflow-y-auto space-y-space-md">
          {vectors.map(vec => (
            <div
              key={vec.id}
              className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/15"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-space-xs text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-lg">{vec.icon}</span>
                  <span>{vec.title}</span>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm font-bold">
                  {vec.weight}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                {vec.desc}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span>{vec.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-space-md bg-surface-container-low flex justify-end border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-label-md font-bold shadow-sm"
          >
            Close Vectors Overview
          </button>
        </div>
      </div>
    </div>
  );
};
