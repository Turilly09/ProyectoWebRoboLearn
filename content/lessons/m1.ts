
import { LessonData } from '../../types/lessons';

export const m1: LessonData = {
  id: 'm1',
  title: "Fundamentos de Electricidad",
  subtitle: "Módulo 1: La base de todo",
  sections: [
    {
      title: "1. Fenómenos de la electricidad estática",
      content: "La electricidad estática es un fenómeno físico que ocurre cuando las cargas eléctricas se acumulan en la superficie de un objeto. Hace siglos, científicos observaron que al frotar materiales como el ámbar con seda, estos adquirían la capacidad de atraer objetos ligeros.\n\nEste proceso se conoce como carga por fricción: al frotar dos cuerpos, los electrones son arrancados de un material y transferidos al otro. El material que pierde electrones queda con carga positiva, mientras que el que los gana adquiere carga negativa. Este es el principio fundamental que rige desde el simple calambre al tocar un pomo hasta la formación de los rayos en una tormenta.",
      image: "https://images.unsplash.com/photo-1576158113928-4c240eaaf360?auto=format&fit=crop&q=80&w=1000",
      fact: "¿Sabías que la palabra 'electricidad' viene del griego 'elektron', que significa ámbar, debido a los experimentos de Tales de Mileto?"
    },
    {
      title: "2. ¿Qué es la Electricidad?",
      content: "La electricidad es simplemente el flujo de electrones de un átomo a otro. Cuando aplicamos una fuerza (como una batería), los electrones 'saltan' entre los átomos de un material conductor, creando una corriente eléctrica. Es similar al flujo de agua por una tubería, donde la presión sería el voltaje y el caudal la intensidad.",
      image: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&q=80&w=1000",
      fact: "Los electrones viajan a velocidades cercanas a la de la luz, aunque su movimiento individual dentro del cable es sorprendentemente lento."
    },
    {
      title: "3. Conductores vs Aislantes",
      content: "No todos los materiales permiten el paso de la electricidad. Los metales como el cobre, la plata y el oro son excelentes conductores porque tienen 'electrones libres' que se mueven con facilidad. Por el contrario, los aislantes como el caucho, el vidrio o el plástico, mantienen sus electrones fuertemente unidos a sus núcleos, bloqueando el paso de la corriente.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&q=80&w=1000",
      fact: "El agua pura es técnicamente un aislante; son los minerales e impurezas disueltas en ella lo que la convierten en un conductor peligroso."
    },
    {
      title: "4. Aplicaciones en Robótica",
      content: "En robótica, entender la estática es crucial para proteger los componentes sensibles. Una descarga electrostática (ESD) puede destruir un microcontrolador Arduino en un instante. Por eso, los ingenieros utilizan pulseras antiestáticas y tapetes especiales al ensamblar sus prototipos.",
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000",
      fact: "Muchos fallos misteriosos en circuitos se deben a micro-descargas que no podemos sentir pero que dañan el silicio."
    }
  ],
  quiz: {
    question: "¿Qué ocurre cuando frotamos dos materiales diferentes según el fenómeno de la electricidad estática?",
    options: ["Se crean nuevos protones", "Se transfieren electrones de un cuerpo a otro", "Los neutrones desaparecen", "El material se vuelve radioactivo"],
    correctIndex: 1,
    hint: "Recuerda que la carga eléctrica se debe al movimiento de las partículas que orbitan el núcleo."
  }
};
