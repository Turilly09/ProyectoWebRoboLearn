import React from 'react';

interface Props {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content, className = "" }) => {
  if (!content) return null;

  // 1. Dividir por doble salto de línea para detectar párrafos
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, pIndex) => {
        // 2. Dividir por ** para detectar negrita
        // La expresión regular captura el delimitador para poder procesarlo
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);

        return (
          <p key={pIndex} className="mb-6 leading-relaxed last:mb-0">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                // Eliminar los asteriscos y renderizar en negrita
                return <strong key={i} className="font-black text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
              }
              // Renderizar texto normal, preservando saltos de línea simples si los hay
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};