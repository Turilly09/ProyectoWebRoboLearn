
import { PracticeData } from '../../types/practices';

export const p1: PracticeData = {
  id: 'p1',
  title: "Tu primer circuito: Serie",
  subtitle: "Laboratorio de Práctica No-Code",
  objective: "Crear un circuito en serie con dos bombillas y un generador de continua de 5V para entender la caída de tensión.",
  simulatorUrl: "https://www.falstad.com/circuit/circuitjs.html?showToolBar=true&cct=%24+1+0.000005+10.200277308269971+50+5.0+43",
  tutorPrompt: "Explícame brevemente por qué las bombillas brillan menos en serie que en paralelo y cómo puedo verificar el voltaje en Falstad.",
  steps: [
    {
      title: "Añadir la Fuente",
      desc: "En el menú superior 'Draw', selecciona 'Inputs/Outputs' -> 'Add Voltage Source (2-terminal)'. Colócala a la izquierda y configúrala a 5V."
    },
    {
      title: "Primera Bombilla",
      desc: "Busca en 'Draw' -> 'Outputs and Labels' -> 'Add Lamp'. Conéctala al terminal positivo de la fuente."
    },
    {
      title: "Segunda Bombilla",
      desc: "Añade otra bombilla justo a continuación de la primera. No olvides cerrar el circuito hacia el terminal negativo."
    },
    {
      title: "Medición",
      desc: "Observa el flujo de corriente. ¿Brillan igual las bombillas que si solo hubiera una?"
    }
  ]
};
