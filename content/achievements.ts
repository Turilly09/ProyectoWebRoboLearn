
export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string; // Tailwind class like 'text-yellow-500'
  condition: string; // Descripción humana de la condición
}

export const BADGES: Badge[] = [
  {
    id: 'first_steps',
    title: 'Primeros Pasos',
    description: 'Completaste tu primera lección.',
    icon: 'footprint',
    color: 'text-blue-400',
    condition: 'Completar 1 lección'
  },
  {
    id: 'builder',
    title: 'Constructor',
    description: 'Publicaste tu primer proyecto en la comunidad.',
    icon: 'construction',
    color: 'text-amber-500',
    condition: 'Publicar 1 proyecto'
  },
  {
    id: 'scholar',
    title: 'Erudito',
    description: 'Has alcanzado el nivel 5 de ingeniería.',
    icon: 'school',
    color: 'text-purple-400',
    condition: 'Alcanzar Nivel 5'
  },
  {
    id: 'contributor',
    title: 'Contribuidor',
    description: 'Aprobaste un término en la Wiki.',
    icon: 'menu_book',
    color: 'text-green-400',
    condition: 'Wiki aprobada'
  },
  {
    id: 'social',
    title: 'Voz de la Comunidad',
    description: 'Participaste en el foro.',
    icon: 'forum',
    color: 'text-pink-400',
    condition: 'Crear 1 post'
  },
  {
    id: 'certified',
    title: 'Certificado',
    description: 'Completaste una Ruta de Aprendizaje completa.',
    icon: 'workspace_premium',
    color: 'text-yellow-400',
    condition: 'Completar 1 Workshop Final'
  }
];

export const getBadgeById = (id: string) => BADGES.find(b => b.id === id);
