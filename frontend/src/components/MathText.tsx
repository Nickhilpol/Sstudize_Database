import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text?: any;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (text === null || text === undefined) return null;

  // If text is passed as JSON object
  let raw = '';
  if (typeof text === 'string') {
    raw = text;
  } else if (typeof text === 'object') {
    raw = text.text || text.question || text.body || JSON.stringify(text);
  } else {
    raw = String(text);
  }

  // Regex to split by $$...$$ or $...$
  const parts = raw.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);

  return (
    <span className={`inline-block leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <div key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2" />;
          } catch {
            return <span key={index} className="font-mono bg-slate-100 px-1">{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={index} className="font-mono bg-slate-100 px-1">{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
