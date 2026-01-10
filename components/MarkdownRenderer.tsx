
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

  // Función para procesar texto y detectar términos wiki
  const processTextWithWiki = (text: string) => {
    if (!wikiEntries.length || !onWikiClick) return text;

    // 1. Ordenar términos por longitud descendente para evitar conflictos (ej: matchear "Voltage Divider" antes que "Voltage")
    const sortedEntries = [...wikiEntries].sort((a, b) => b.term.length - a.term.length);
    
    // 2. Crear Regex dinámica. Usamos \b para límites de palabra, 'gi' para global e insensible a mayúsculas
    // Escapamos caracteres especiales en los términos por seguridad
    const pattern = new RegExp(`\\b(${sortedEntries.map(e => e.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

    // 3. Dividir el texto
    const parts = text.split(pattern);

    // 4. Mapear partes y reconstruir
    return parts.map((part, i) => {
      const entry = sortedEntries.find(e => e.term.toLowerCase() === part.toLowerCase());
      
      if (entry) {
        return (
          <span 
            key={i} 
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

  // 1. Dividir por doble salto de línea para detectar párrafos
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, pIndex) => {
        // 2. Dividir por ** para detectar negrita
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);

        return (
          <p key={pIndex} className="mb-6 leading-relaxed last:mb-0">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                // Eliminar los asteriscos y renderizar en negrita (El contenido en negrita NO se procesa para wiki para evitar conflictos)
                return <strong key={i} className="font-black text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
              }
              // Renderizar texto normal procesado con Wiki
              return <span key={i}>{processTextWithWiki(part)}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};
