
import { LearningPath, Project } from '../../types';

const ELECTRONICA_WORKSHOP: Project = {
  id: 'w_elec_1',
  title: 'Fuente de Alimentación Regulable',
  description: 'Diseño y construcción de una fuente de 0-12V con protección de cortocircuito. Este es el proyecto final que valida tus conocimientos de electrónica analógica.',
  image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
  category: 'Hardware',
  author: 'Sistema',
  isWorkshop: true,
  estimatedTime: "4 Horas",
  difficulty: "Media",
  videoUrl: "https://www.youtube.com/embed/CIGjActDeoM?si=DummyVideoID", // Ejemplo, usar video real
  requirements: [
    "Transformador 220V a 24V AC",
    "Puente rectificador de diodos (KBP206)",
    "Condensador electrolítico 2200uF 50V",
    "Regulador de voltaje LM317T",
    "Potenciómetro 5k Ohm lineal",
    "Resistencia 220 Ohm",
    "Disipador de calor de aluminio",
    "Borneras de conexión y PCB perforada"
  ],
  steps: [
    {
      title: "Preparación del PCB y Componentes",
      description: "Organiza todos los componentes sobre la mesa de trabajo. Limpia la placa perforada con alcohol isopropílico para asegurar buenas soldaduras. Identifica la polaridad del condensador electrolítico y el pinout del LM317.",
      image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Etapa de Rectificación",
      description: "Suelda el puente de diodos y el condensador de filtrado. Conecta la salida del transformador a la entrada AC del puente. Mide con el multímetro: deberías tener unos 33V DC en los extremos del condensador.",
      image: "https://images.unsplash.com/photo-1616423646545-0d4187314279?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Regulación con LM317",
      description: "Instala el LM317 en el disipador antes de soldarlo. Conecta la resistencia de 220 Ohm entre el pin de Ajuste y Salida. Conecta el potenciómetro entre Ajuste y Tierra.",
      image: "https://images.unsplash.com/photo-1599357473722-c82092f6dbd9?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Pruebas Finales",
      description: "Antes de conectar ninguna carga, gira el potenciómetro y verifica con el multímetro que la salida varía suavemente entre 1.25V y la tensión máxima. ¡Felicidades, has construido tu fuente!",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=600"
    }
  ]
};

export const e101: LearningPath = {
  id: 'e101',
  title: 'Introducción a la electricidad',
  description: 'Comienza tu viaje sentando las bases de los circuitos eléctricos',
  level: 'Principiante',
  modulesCount: 5,
  progress: 0,
  image: 'https://picsum.photos/seed/elec/800/450',
  color: 'bg-green-500',
  finalWorkshop: ELECTRONICA_WORKSHOP
};