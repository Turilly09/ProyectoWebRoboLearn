
import { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Centro de Hogar Inteligente',
    description: 'Un panel de control centralizado usando Home Assistant en Raspberry Pi.',
    image: 'https://picsum.photos/seed/hub/600/400',
    category: 'IoT',
    author: 'Andres Cebrian'
  },
  {
    id: 'p2',
    title: 'Robot Siguelíneas',
    description: 'Robot autónomo con control PID y sensores infrarrojos.',
    image: 'https://picsum.photos/seed/bot/600/400',
    category: 'Robótica',
    author: 'Elena R.'
  }
];
