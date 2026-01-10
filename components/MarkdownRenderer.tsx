
import React from 'react';
import { WikiEntry } from '../types';

interface Props {
  content: string;
  className?: string;
  wikiEntries?: WikiEntry[];
  onWikiClick?: (entry: WikiEntry) => void;
}

export const MarkdownRenderer: React.FC<Props> = ({ 
  content, 
  className = "", 
  wikiEntries = [], 
  onWikiClick 
}) => {
  if (!content) return null;

  // 1. Procesador de Wiki (Nivel más bajo)
  const processWikiTerms = (text: string) => {
    if (!wikiEntries.length || !onWikiClick) return text;

    const sortedEntries = [...wikiEntries].sort((a, b) => b.term.length - a.term.length);
    const pattern = new RegExp(`\\b(${sortedEntries.map(e => e.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, i) => {
      const entry = sortedEntries.find(e => e.term.toLowerCase() === part.toLowerCase());
      if (entry) {
        return (
          <span 
            key={`wiki-${i}`} 
            onClick={(e) => { e.stopPropagation(); onWikiClick(entry); }}
            className="text-primary font-bold cursor-help border-b-2 border-dotted border-primary/50 hover:bg-primary/10 hover:border-primary transition-all rounded px-0.5"
            title="Ver definición"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // 2. Procesador de Estilos en Línea (Negrita y Cursiva) -> Llama a Wiki
  const renderInlineStyles = (text: string) => {
    // Dividir por negrita (**texto**)
    const boldParts = text.split(/(\*\*.*?\*\*)/g);

    return boldParts.map((part, i) => {
      // Caso Negrita
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={`bold-${i}`} className="font-black text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }

      // Dividir por cursiva (*texto*) dentro de lo que no es negrita
      const italicParts = part.split(/(\*.*?\*)/g);
      
      return (
        <span key={`group-${i}`}>
          {italicParts.map((subPart, j) => {
            // Caso Cursiva
            if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length >= 3) {
              return (
                <em key={`italic-${j}`} className="italic text-slate-700 dark:text-slate-200">
                  {processWikiTerms(subPart.slice(1, -1))}
                </em>
              );
            }
            // Texto normal (Procesar Wiki)
            return <span key={`text-${j}`}>{processWikiTerms(subPart)}</span>;
          })}
        </span>
      );
    });
  };

  // 3. Procesador de Bloques (Párrafos y Centrado)
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, pIndex) => {
        // Dividir por sintaxis de centrado (^^texto^^)
        const centerParts = paragraph.split(/(\^\^.*?\^\^)/g);

        return (
          <p key={pIndex} className="mb-6 leading-relaxed last:mb-0">
            {centerParts.map((part, cIndex) => {
              // Caso Centrado
              if (part.startsWith('^^') && part.endsWith('^^') && part.length >= 4) {
                return (
                  <span key={`center-${cIndex}`} className="block w-full text-center my-4 text-primary/90 font-medium text-lg">
                    {renderInlineStyles(part.slice(2, -2))}
                  </span>
                );
              }
              // Contenido normal del párrafo
              return <span key={`normal-${cIndex}`}>{renderInlineStyles(part)}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};
