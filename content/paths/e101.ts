
import { LearningPath, Project } from '../../types';

const ELECTRONICA_WORKSHOP: Project = {
  id: 'w_elec_1',
  title: 'Fuente de Alimentación Regulable',
  description: 'Diseño y construcción de una fuente de 0-12V con protección de cortocircuito. Este es el proyecto final que valida tus conocimientos de electrónica analógica.',
  image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
  category: 'Hardware',
  author: 'Sistema',
  isWorkshop: true
};

export const e101: LearningPath = {
  id: 'e101',
  title: 'Electrónica Básica',
  description: 'Comienza tu viaje con componentes básicos, circuitos y seguridad.',
  level: 'Principiante',
  modulesCount: 5,
  progress: 0,
  image: 'https://picsum.photos/seed/elec/800/450',
  color: 'bg-green-500',
  finalWorkshop: ELECTRONICA_WORKSHOP
};
