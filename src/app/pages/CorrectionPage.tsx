import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2, ChevronRight, ChevronLeft, BookOpen, BrainCircuit, Target, Lightbulb, ArrowRight, PlayCircle } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { api } from '../../lib/supabase';
import { toast } from 'sonner';

interface CorrectionPageProps {
  user: any;
  token: string;
  onLogout: () => void;
}

export function CorrectionPage({ user, token, onLogout }: CorrectionPageProps) {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const decodedTopic = decodeURIComponent(topic || 'Concept');

  useEffect(() => {
    loadCorrection();
  }, [decodedTopic]);

  const loadCorrection = async () => {
    try {
      const { correction } = await api.getCorrection(token, decodedTopic);
      if (!correction) {
        toast.error('Failed to load correction');
      } else {
        setData(correction);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const steps = data ? [
    {
      id: 'intro',
      title: 'Conceptual Target',
      icon: Target,
      content: (
        <div className="text-center space-y-10 animate-fade-in">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse rounded-full"></div>
            <div className="w-24 h-24 glass-premier bg-white/10 dark:bg-black/20 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-500">
              <Target className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tighter font-heading text-foreground">{data.intro.title}</h2>
          <p className="text-muted-foreground text-xl font-medium max-w-lg mx-auto leading-relaxed">{data.intro.description}</p>
          <div className="glass-premier bg-amber-500/10 p-8 rounded-[2.5rem] border-none shadow-xl text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-[40px]"></div>
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-3">
              <Lightbulb className="w-4 h-4" /> Neural Significance
            </p>
            <p className="text-amber-700 dark:text-amber-200 text-lg font-bold leading-relaxed">{data.intro.why}</p>
          </div>
        </div>
      )
    },
    {
      id: 'explanation',
      title: 'Knowledge Synthesis',
      icon: BookOpen,
      content: (
        <div className="space-y-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase">
            Core Definition
          </div>
          <h3 className="text-3xl font-black font-heading tracking-tight">{data.explanation.title}</h3>
          <p className="text-xl font-medium leading-relaxed text-foreground/80">{data.explanation.text}</p>
          <div className="glass-premier bg-white/5 dark:bg-black/20 p-10 rounded-[2.5rem] border-none shadow-inner relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <p className="font-black text-[10px] uppercase tracking-[0.3em] text-primary mb-4 relative z-10">Axiomatic Pattern</p>
            <p className="font-black text-2xl italic tracking-tight text-foreground relative z-10 leading-tight">"{data.explanation.definition}"</p>
          </div>
        </div>
      )
    },
    {
      id: 'analogy',
      title: 'Mnemonic Mapping',
      icon: BrainCircuit,
      content: (
        <div className="space-y-10 animate-fade-in text-center">
          <h3 className="text-3xl font-black font-heading tracking-tight mb-2">{data.analogy.title}</h3>
          <div className="aspect-video glass-premier bg-indigo-500/5 rounded-[3rem] flex items-center justify-center border-none shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-700">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)]"></div>
            <div className="relative z-10">
              <BrainCircuit className="w-20 h-20 text-primary/40 mx-auto mb-6 animate-pulse-soft" />
              <span className="text-primary font-black text-2xl tracking-tighter uppercase px-6">{data.analogy.visual}</span>
            </div>
          </div>
          <p className="text-xl font-medium leading-relaxed text-muted-foreground max-w-xl mx-auto">{data.analogy.text}</p>
        </div>
      )
    },
    {
      id: 'example',
      title: 'Practical Application',
      icon: PlayCircle,
      content: (
        <div className="space-y-10 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-3xl font-black font-heading tracking-tight">Algorithmic Decomposition</h3>
            <p className="text-muted-foreground font-medium text-lg mt-2">Execute the conceptual logic step-by-step</p>
          </div>
          <div className="space-y-6">
            <div className="glass-premier bg-white/5 p-8 rounded-3xl border-none shadow-xl flex items-start gap-6 group hover:translate-x-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-muted/10 flex items-center justify-center text-[10px] font-black text-muted-foreground tracking-widest shrink-0">V1</div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Initial State</span>
                <p className="font-bold text-xl mt-1 tracking-tight">{data.example.step1}</p>
              </div>
            </div>

            <div className="flex justify-center -my-3">
              <div className="w-px h-10 bg-gradient-to-b from-primary/40 to-transparent"></div>
            </div>

            <div className="glass-premier bg-primary/5 p-8 rounded-3xl border-none shadow-xl border-l-4 border-l-primary flex items-start gap-6 group hover:translate-x-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black tracking-widest shrink-0 shadow-lg">V2</div>
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Mutation Protocol</span>
                <p className="font-black text-xl mt-1 tracking-tight">{data.example.step2}</p>
              </div>
            </div>

            <div className="flex justify-center -my-3">
              <div className="w-px h-10 bg-gradient-to-b from-primary/40 to-transparent"></div>
            </div>

            <div className="glass-premier bg-emerald-500/10 p-8 rounded-3xl border-none shadow-xl border-l-4 border-l-emerald-500 flex items-start gap-6 group hover:translate-x-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-black tracking-widest shrink-0 shadow-lg">VS</div>
              <div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Stable State/Result</span>
                <p className="font-black text-2xl mt-1 tracking-tighter text-emerald-600 dark:text-emerald-400">{data.example.answer}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'finish',
      title: 'Re-Synchronization',
      icon: CheckCircle2,
      content: (
        <div className="space-y-10 text-center animate-fade-in py-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] animate-pulse rounded-full"></div>
            <div className="w-28 h-28 glass-premier bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10">
              <CheckCircle2 className="w-14 h-14" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black font-heading tracking-tighter">System Synchronized</h2>
            <p className="text-muted-foreground text-xl font-medium max-w-md mx-auto leading-relaxed">
              Conceptual repair complete for <span className="text-foreground font-black underline decoration-primary/30 decoration-2">{decodedTopic}</span>. Readiness confirmed.
            </p>
          </div>
        </div>
      )
    }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest opacity-20">Initialization Fault.</div>;

  const currentStepData = steps[currentStep];
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-primary/20">
      <Navbar user={user} onLogout={onLogout} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col relative z-10">

        {/* Progress System */}
        <div className="mb-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">KNOWLEDGE VECTOR</span>
              <span className="font-black text-xl tracking-tighter text-foreground">{currentStepData.title}</span>
            </div>
            <div className="bg-muted/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Phase {currentStep + 1} <span className="opacity-30 mx-2">/</span> {steps.length}
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative shadow-inner">
            <div className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-700 ease-in-out" style={{ width: `${progressPercent}%` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
            </div>
          </div>
        </div>

        {/* Neural Transmission Module */}
        <Card className="flex-1 glass-premier border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] rounded-[3rem] flex flex-col overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px]"></div>

          <CardContent className="flex-1 p-10 sm:p-16 flex flex-col justify-center relative z-10 min-h-[500px]">
            {currentStepData.content}
          </CardContent>

          {/* Controller Interface */}
          <div className="p-8 md:p-10 bg-white/[0.02] border-t border-white/5 flex justify-between items-center relative z-10">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="h-16 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 text-muted-foreground transition-all disabled:opacity-0"
            >
              <ChevronLeft className="w-5 h-5 mr-3" /> Relink Previous
            </Button>

            <Button onClick={() => {
              if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
              else navigate('/revision');
            }} className="h-20 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all active:scale-95 group">
              {currentStep === steps.length - 1 ? 'Execute Readiness' : 'Continue Sequence'}
              <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>
      </main>

      {/* Background Aura */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>
    </div>
  );
}
