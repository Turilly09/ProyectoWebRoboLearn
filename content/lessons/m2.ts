
import { LessonData } from '../../types/lessons';

export const m2: LessonData = {
  id: 'm2',
  title: "Seguridad en el Laboratorio",
  subtitle: "Módulo 2: Tu integridad es lo primero",
  sections: [
    {
      title: "1. Riesgo Eléctrico y el Cuerpo",
      content: "El cuerpo humano es un conductor. Una corriente tan pequeña como 30mA puede ser peligrosa. Siempre trabaja con una mano si el circuito está vivo para evitar que la corriente pase por el corazón.",
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000",
      fact: "La resistencia de la piel seca es mucho mayor que la de la piel húmeda."
    },
    {
      title: "2. Manejo de Soldadores",
      content: "Un cautín alcanza temperaturas superiores a 350°C. Nunca dejes un soldador encendido sin supervisión y usa siempre su soporte. El contacto accidental puede causar quemaduras de tercer grado en milisegundos.",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000",
      fact: "El estaño fundido puede 'saltar', por lo que las gafas de seguridad son obligatorias."
    },
    {
      title: "3. Humos y Ventilación",
      content: "La soldadura contiene resinas y a veces plomo. Los humos generados son tóxicos y pueden irritar los pulmones a largo plazo. Usa siempre un extractor de humos o trabaja en un área con ventilación cruzada.",
      image: "https://images.unsplash.com/photo-1516216628859-9bccecab13ca?auto=format&fit=crop&q=80&w=1000",
      fact: "Muchos ingenieros usan soldadura 'lead-free' para reducir la exposición al plomo."
    }
  ],
  quiz: {
    question: "¿Cuál es la acción más importante antes de modificar un circuito hardware?",
    options: ["Usar guantes", "Desconectar la fuente de energía", "Soplar los componentes", "Ponerse gafas"],
    correctIndex: 1,
    hint: "La regla de oro: sin energía no hay riesgo de corto o descarga."
  }
};
