
import { LearningPath, Project } from '../../types';

const D3D_WORKSHOP: Project = {
  id: 'w_d3d_1',
  title: 'Brazo Robótico Modular',
  description: 'Diseña, modela e imprime un brazo robótico de 3 ejes totalmente funcional. ',
  image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000',
  category: 'Diseño 3D',
  author: 'Sistema',
  isWorkshop: true,
  estimatedTime: "6 Horas",
  difficulty: "Alta",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=Dummy", // Placeholder
  requirements: [
     "Impresora 3D FDM",
     "Filamento PLA o PETG (1kg)",
     "Calibre digital",
     "3x Servomotores MG996R",
     "Tornillería M3 variada",
     "Software CAD (Fusion 360 / Tinkercad)"
  ],
  steps: [
    {
      title: "Conceptos de Tolerancia",
      description: "Antes de diseñar piezas móviles, debemos calibrar la impresora. Diseñaremos un cubo de calibración para entender el 'clearance' necesario para uniones impresas (usualmente 0.2mm - 0.3mm).",
      image: "https://images.unsplash.com/photo-1615840287214-7ff58ee0489b?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Modelado de la Base Giratoria",
      description: "Usa operaciones de extrusión y revolución para crear la base donde se alojará el primer servo. Asegúrate de dejar espacio para los cables y orificios de montaje.",
      image: "https://images.unsplash.com/photo-1535378620166-273708d44e4c?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Laminado (Slicing) Avanzado",
      description: "Configura el slicer para resistencia mecánica: 3 perímetros de pared, 4 capas superiores/inferiores y un relleno (infill) del 40% tipo Gyroid para soportar torsión.",
      image: "https://images.unsplash.com/photo-1631541909061-71e349d1f203?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Ensamblaje y Ajuste",
      description: "Lija las superficies de contacto. Inserta los servos y atornilla las articulaciones. Verifica que el movimiento sea suave manualmente antes de conectar la electrónica.",
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600"
    }
  ]
};

export const diseno3d: LearningPath = {
  id: 'd3d1',
  title: 'Diseño e Impresión 3D',
  description: 'Domina el flujo de trabajo de la fabricación aditiva. Desde el boceto en CAD hasta la pieza física funcional.',
  level: 'Principiante',
  modulesCount: 6,
  progress: 0,
  image: 'https://images.unsplash.com/photo-1631541909061-71e349d1f203?auto=format&fit=crop&q=80&w=800',
  color: 'bg-orange-600',
  finalWorkshop: D3D_WORKSHOP
};
