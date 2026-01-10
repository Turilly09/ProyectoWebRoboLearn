
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { geminiService } from '../services/gemini';
import { getLessonById } from '../content/registry';
import { LessonData } from '../types/lessons';

const IDE: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [practice, setPractice] = useState<LessonData | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'tutor'>('guide');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [circuitCode, setCircuitCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPractice = async () => {
      if (id) {
        setIsLoading(true);
        const data = await getLessonById(id);
        if (data && data.type === 'practice') {
          setPractice(data);
        }
        setIsLoading(false);
      }
    };
    loadPractice();
  }, [id]);

  const handleTutorHelp = async () => {
    if (!practice || !practice.steps) return;
    setIsAnalyzing(true);
    
    const stepContext = practice.steps[currentStep] 
      ? `Paso ${currentStep + 1}: ${practice.steps[currentStep].title}`
      : "Contexto general";

    const res = await geminiService.getTutorAssistance(
      practice.title,
      "Lograr que el circuito funcione según la guía",
      stepContext,
      "¿Hay algún error en mi diseño de circuito actual?",
      circuitCode
    );
    
    setAiResponse(res);
    setIsAnalyzing(false);
    setActiveTab('tutor');
  };

  if (isLoading || !practice) {
    return (
      <div className="h-screen bg-background-dark flex items-center justify-center flex-col gap-4 text-white">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-text-secondary uppercase tracking-widest text-xs">Cargando Laboratorio...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0b0f14] overflow-hidden text-white font-body">
      <header className="h-14 flex items-center justify-between bg-[#111a22] border-b border-[#233648] px-4 shrink-0 shadow-xl z-20">
        <div className="flex items-center gap-4">
          <Link to="/paths" className="p-2 rounded-lg hover:bg-card-dark text-text-secondary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-white text-xs font-black uppercase tracking-widest">{practice.title}</h2>
            <p className="text-[10px] text-primary font-bold">{practice.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
          >
            FINALIZAR PRÁCTICA
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 md:w-96 bg-[#111a22] border-r border-[#233648] flex flex-col shrink-0 z-10 shadow-2xl">
           <div className="flex bg-[#16202a] border-b border-[#233648]">
              <button onClick={() => setActiveTab('guide')} className={`flex-1 py-4 text-[10px] font-black uppercase transition-all border-b-2 ${activeTab === 'guide' ? 'border-primary text-white' : 'border-transparent text-text-secondary'}`}>Guía de Pasos</button>
              <button onClick={() => setActiveTab('tutor')} className={`flex-1 py-4 text-[10px] font-black uppercase transition-all border-b-2 ${activeTab === 'tutor' ? 'border-primary text-white' : 'border-transparent text-text-secondary'}`}>IA Tutor</button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {activeTab === 'guide' ? (
                <div className="space-y-4">
                    {practice.steps?.map((step, i) => (
                      <div 
                        key={i} 
                        onClick={() => setCurrentStep(i)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${currentStep === i ? 'bg-primary/10 border-primary shadow-lg' : 'bg-[#16202a] border-border-dark opacity-60'}`}
                      >
                         <div className="flex items-center gap-3 mb-2">
                            <span className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === i ? 'bg-primary text-white' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</span>
                            <h4 className="text-xs font-bold text-white uppercase">{step.title}</h4>
                         </div>
                         <p className="text-[11px] text-text-secondary leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="space-y-6">
                   <textarea 
                      value={circuitCode}
                      onChange={(e) => setCircuitCode(e.target.value)}
                      className="w-full h-24 bg-black/40 border border-border-dark rounded-xl p-3 text-[10px] font-mono text-green-400 focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Pega aquí el texto del circuito..."
                   />
                   <button onClick={handleTutorHelp} disabled={isAnalyzing} className="w-full py-3 bg-primary text-white text-[10px] font-black rounded-xl uppercase">Solicitar Ayuda IA</button>
                   {aiResponse && <div className="bg-[#16202a] rounded-2xl p-6 border border-border-dark text-xs text-slate-300 leading-relaxed">{aiResponse}</div>}
                </div>
              )}
           </div>
        </aside>

        <main className="flex-1 bg-black relative min-w-0">
          <iframe 
            src={practice.simulatorUrl} 
            className="w-full h-full border-none"
            title="Simulator"
            allow="fullscreen"
          />
        </main>
      </div>
    </div>
  );
};

export default IDE;
