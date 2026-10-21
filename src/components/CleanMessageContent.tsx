import React from 'react';

interface CleanMessageContentProps {
  content: string;
  isBot?: boolean;
}

/**
 * Cleanly renders chat messages with ZERO raw markdown symbols ('#', '##', '###', '**', or '*').
 * Converts structure into clean, executive typography without exposing technical syntax symbols.
 */
export const CleanMessageContent: React.FC<CleanMessageContentProps> = ({ content, isBot = false }) => {
  if (!content) return null;

  // Process text line by line
  const lines = content.split('\n');

  const cleanInlineFormatting = (text: string): React.ReactNode[] => {
    // 1. Remove # from rankings like "#1" -> "Pasangan 1" or "Nombor 1"
    let sanitized = text
      .replace(/#(\d+)/g, 'Pasangan $1')
      .replace(/#+/g, ''); // strip any remaining hash characters completely

    // 2. Parse bold (**text**) without leaking asterisks
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = boldRegex.exec(sanitized)) !== null) {
      if (match.index > lastIndex) {
        // Plain text before bold - strip any asterisks completely
        const plain = sanitized.substring(lastIndex, match.index).replace(/\*/g, '');
        if (plain) parts.push(plain);
      }
      // Bold text without asterisks
      const boldText = match[1].replace(/\*/g, '');
      if (boldText) {
        parts.push(
          <strong key={`bold-${match.index}`} className={isBot ? 'font-semibold text-stone-900' : 'font-semibold'}>
            {boldText}
          </strong>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < sanitized.length) {
      const remaining = sanitized.substring(lastIndex).replace(/\*/g, '');
      if (remaining) parts.push(remaining);
    }

    const finalParts = parts.length > 0 ? parts : [sanitized.replace(/\*/g, '')];
    return finalParts;
  };

  return (
    <div className="space-y-1.5 font-sans leading-relaxed">
      {lines.map((line, index) => {
        // Strip any leading and trailing hashes, plus any asterisks
        let trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-1.5" />;
        }

        // Check if line was a heading (starts with #, ##, ###)
        if (trimmed.startsWith('#')) {
          const headingText = trimmed
            .replace(/^#+\s*/, '')
            .replace(/#(\d+)/g, 'Pasangan $1')
            .replace(/#/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .trim();

          return (
            <div
              key={index}
              className={`font-serif font-bold text-xs sm:text-sm pt-1 pb-0.5 ${
                isBot ? 'text-[#b48246]' : 'text-white'
              }`}
            >
              {cleanInlineFormatting(headingText)}
            </div>
          );
        }

        // Check if line was an unordered list item (starts with * or - or •)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed
            .replace(/^(\*|-|•)\s+/, '')
            .replace(/\*/g, '')
            .replace(/#/g, '');

          return (
            <div key={index} className="flex items-start gap-2 pl-1 my-0.5">
              <span className={`text-[10px] select-none mt-0.5 ${isBot ? 'text-[#b48246]' : 'text-white/80'}`}>
                •
              </span>
              <div className="flex-1">{cleanInlineFormatting(bulletText)}</div>
            </div>
          );
        }

        // Regular line: strip any stray '#' or '*' that may have been typed
        return (
          <div key={index}>
            {cleanInlineFormatting(line)}
          </div>
        );
      })}
    </div>
  );
};
