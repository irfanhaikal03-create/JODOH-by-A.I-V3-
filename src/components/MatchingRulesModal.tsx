import React from 'react';

interface MatchingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchingRulesModal: React.FC<MatchingRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const rules = [
    {
      title: 'Rule 01: Minimum Quorum Constraint (PRD F04)',
      summary: 'Mandates presence of ≥ 1 Male and ≥ 1 Female participant prior to vector synthesis.',
      status: 'Enforced via Guard Matrix',
    },
    {
      title: 'Rule 02: Habit Concordance Weighting',
      summary: 'Smoking habits carry a high compatibility penalty (-10%) when discordant, and concordance bonus (+8%).',
      status: 'Active (100% Sync Enforced)',
    },
    {
      title: 'Rule 03: Mutual Target Dynamics Cross-Matching',
      summary: 'Candidate "Ideal Partner Dynamics" qualitative narratives are bi-directionally cross-parsed using semantic similarity.',
      status: 'Active in Batch Prompting',
    },
    {
      title: 'Rule 04: 1-to-1 Exclusive Pairing (Zero Partner Overlap)',
      summary: 'Each candidate appears at most once in the final matched couples list. Once paired, neither partner can be matched with anyone else, guaranteeing mutually exclusive pairings.',
      status: 'Strict 1-to-1 Unique Enforced',
    },
    {
      title: 'Rule 05: Discreet On-Device Privacy',
      summary: 'Strict adherence to attendee privacy: no external cloud database persistence; records stay confined to active browser storage.',
      status: 'Zero Data-Leakage Standard',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-outline-variant/30">
        <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-2xl">tune</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif font-semibold">
                Event Matching Rules & Guardrails
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Configuration and operational logic parameters
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
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/15"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-on-surface text-sm">
                  {rule.title}
                </span>
                <span className="px-space-xs py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-xs font-semibold border border-emerald-200">
                  {rule.status}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                {rule.summary}
              </p>
            </div>
          ))}
        </div>

        <div className="p-space-md bg-surface-container-low flex justify-end border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-label-md font-bold shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
