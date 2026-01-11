
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

  // 1. Procesador de Estilos en Línea (Negrita y Cursiva)
  // Nota: Se ha eliminado el resaltado automático de Wiki para limpiar la lectura
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
                  {subPart.slice(1, -1)}
                </em>
              );
            }
            // Texto normal
            return <span key={`text-${j}`}>{subPart}</span>;
          })}
        </span>
      );
    });
  };

  // 2. Procesador de Bloques (Párrafos y Centrado)
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
