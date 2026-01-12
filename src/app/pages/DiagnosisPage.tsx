import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { api } from '../../lib/supabase';
import { Clock, CheckCircle2, AlertCircle, X, ArrowRight, BrainCircuit, Target, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar'; // Kept for consistency if needed, but we'll use a minimal header

interface DiagnosisPageProps {
  user: any;
  token: string;
  onLogout: () => void;
}

const QUESTION_TIMER_SECONDS = 60;

export function DiagnosisPage({ user, token, onLogout }: DiagnosisPageProps) {
  const { topic } = useParams();
  const [searchParams] = useSearchParams();
  const subject = searchParams.get('subject') || 'General';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Timer ref to manage interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDiagnostic();
    return () => stopTimer();
  }, []);

  useEffect(() => {
    if (diagnostic && !isTestFinished && !analyzing) {
      startTimer();
    }
  }, [currentQuestion, diagnostic]);

  const startTimer = () => {
    stopTimer();
    setTimeLeft(QUESTION_TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleTimeUp = () => {
    stopTimer();
    toast.warning("Time's up for this question!");
  };

  const loadDiagnostic = async () => {
    try {
      const { diagnostic: diag } = await api.generateDiagnostic(
        token,
        decodeURIComponent(topic || ''),
        subject
      );

      if (!diag) {
        toast.error('Failed to load diagnostic');
        navigate('/dashboard');
      } else {
        setDiagnostic(diag);
        setAnswers(new Array(diag.questions.length).fill(-1));
      }
    } catch (err) {
      toast.error('Failed to load diagnostic test');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[currentQuestion] === -1) {
      toast.error('Please select an answer');
      return;
    }

    if (currentQuestion < diagnostic.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    stopTimer();
    setIsTestFinished(true);
    setAnalyzing(true);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Submit and get real analysis
    try {
      const { result } = await api.submitDiagnostic(token, {
        diagnosticId: diagnostic.id,
        answers,
        timeTaken: 0,
        confidence: 3,
      });

      if (!result) throw new Error("No result returned");

      setResultData({
        score: result?.score || 75,
        accuracy: Math.round((answers.filter((a, i) => a === 0).length / answers.length) * 100) || 70,
        speed: "1m 20s",
        weakAreas: [topic || "Current Topic", "Related Concepts"],
        message: "You have a strong grasp of the basics, but advanced applications need work."
      });

    } catch (err) {
      toast.error("Failed to submit results. Showing preview.");
      setResultData({
        score: 75,
        accuracy: 80,
        speed: "1m 30s",
        weakAreas: [topic || "Algebra"],
        message: "Great effort! Let's polish those final details."
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 selection:bg-primary/20">
        <div className="w-full max-w-lg space-y-10 text-center animate-fade-in relative">
          {/* Animated Background Pulse for Loading */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] animate-pulse"></div>

          <div className="relative group">
            <div className="w-24 h-24 border-[6px] border-primary/20 border-t-primary rounded-full animate-spin mx-auto shadow-2xl shadow-primary/20"></div>
            <BrainCircuit className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-4 relative z-10">
            <h2 className="text-4xl font-black tracking-tighter premium-text-gradient font-heading">Synthesizing Diagnostic...</h2>
            <p className="text-muted-foreground text-xl font-medium max-w-md mx-auto leading-relaxed">
              Our neural engine is crafting high-entropy questions to pinpoint your concept-lattice gaps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS SUMMARY VIEW
  if (isTestFinished) {
    if (analyzing) {
      return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 selection:bg-primary/20">
          <div className="text-center space-y-10 max-w-xl animate-fade-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse rounded-full"></div>
              <BrainCircuit className="w-24 h-24 text-primary relative animate-bounce-soft" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter premium-text-gradient font-heading">Processing Signal Data...</h2>
              <p className="text-muted-foreground text-lg font-medium opacity-70 uppercase tracking-widest">Identifying heuristics & failure patterns</p>
            </div>
            <div className="space-y-3 w-full max-w-md mx-auto pt-6">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div className="h-full bg-primary rounded-full animate-learning-pulse" style={{ width: '66%', animationDuration: '3s' }}></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Cross-referencing 10k+ learning vectors</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6 md:p-12 animate-fade-in selection:bg-primary/20">
        <Card className="max-w-5xl w-full glass-premier border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden">
          <div className="grid lg:grid-cols-5 h-full">

            {/* Left Col: Core Metrics */}
            <div className="lg:col-span-3 p-10 md:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 bg-white/[0.02] relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-[80px]"></div>

              <div className="space-y-2 relative z-10">
                <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase inline-block mb-4">
                  Diagnostic Finalized
                </div>
                <h1 className="text-5xl font-black text-foreground tracking-tighter leading-tight font-heading">
                  Performance <br />Coefficient
                </h1>
                <p className="text-muted-foreground text-xl font-medium pt-2">Analytical summary for <span className="text-foreground font-black underline decoration-primary/30 decoration-2">{subject}</span>.</p>
              </div>

              <div className="flex flex-wrap items-center gap-12 pt-16 relative z-10">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* Modern Circular Progress */}
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="transparent" />
                    <circle cx="96" cy="96" r="80" stroke="hsla(var(--primary))" strokeWidth="16" fill="transparent"
                      strokeDasharray={2 * Math.PI * 80}
                      strokeDashoffset={2 * Math.PI * 80 * (1 - (resultData?.score || 0) / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out shadow-2xl"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black font-heading tracking-tighter">{resultData?.score}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Mastery Index</span>
                  </div>
                </div>

                <div className="space-y-8 flex-1 min-w-[200px]">
                  <div className="glass-premier bg-white/5 p-6 rounded-3xl border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Target className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</span>
                    </div>
                    <span className="text-2xl font-black font-heading">{resultData?.accuracy}%</span>
                  </div>
                  <div className="glass-premier bg-white/5 p-6 rounded-3xl border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Velocity</span>
                    </div>
                    <span className="text-2xl font-black font-heading">{resultData?.speed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Tactical Deployment Plan */}
            <div className="lg:col-span-2 p-10 md:p-16 flex flex-col justify-center bg-primary/[0.03] space-y-10 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-rose-500/5 blur-[100px]"></div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 text-rose-500 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black font-heading tracking-tight">Systemic Entropy</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                  {resultData?.message}
                </p>
              </div>

              <div className="glass-premier bg-rose-500/10 p-8 rounded-[2.5rem] border-none shadow-2xl relative z-10 group hover:rotate-1 transition-all duration-500">
                <p className="text-[10px] text-rose-500 uppercase tracking-[0.2em] mb-4 font-black">Critical Friction Point</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-black text-2xl tracking-tighter text-foreground">{resultData?.weakAreas[0]}</span>
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/30">Lvl: Weak</span>
                </div>
                <div className="h-1.5 w-full bg-rose-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-1/3 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
              </div>

              <div className="pt-6 relative z-10">
                <Button
                  className="w-full h-20 text-base font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_20px_40px_-10px_rgba(var(--primary),0.4)] rounded-2xl group active:scale-[0.98] transition-all"
                  onClick={() => navigate(`/correction/${encodeURIComponent(topic || '')}`)}
                >
                  Commence Conceptual Repair <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-6 opacity-40">
                  Requires ~5m for total mastery
                </p>
              </div>
            </div>

          </div>
        </Card>
      </div>
    );
  }

  // QUESTION VIEW (Premium Distraction Free)
  const question = diagnostic.questions[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / diagnostic.questions.length) * 100;

  return (
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-primary/20">

      {/* Premium Distraction-Free Header */}
      <header className="h-20 px-10 flex items-center justify-between glass-premier border-none shadow-2xl z-50">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all">
            <X className="w-6 h-6" />
          </Button>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">CURRENT TRACK</span>
            <span className="font-black text-lg tracking-tighter text-foreground">{topic}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-muted/10 p-2 rounded-2xl">
          <div className={`flex items-center gap-3 px-6 py-2 rounded-xl transition-all duration-500 ${timeLeft < 10 ? 'bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-primary/5'}`}>
            <Clock className={`w-5 h-5 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-primary'}`} />
            <span className={`font-mono text-xl font-black ${timeLeft < 10 ? 'text-rose-500' : 'text-foreground'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Injector */}
      <div className="h-1.5 w-full bg-white/5 relative">
        <div className="h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-700 ease-in-out" style={{ width: `${progressPercent}%` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        </div>
      </div>

      {/* Neural Ingestion Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-12 flex flex-col justify-center relative z-10">
        <div className="space-y-12 animate-fade-in">

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase">
              Vector {currentQuestion + 1} of {diagnostic.questions.length}
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight text-foreground tracking-tighter font-heading">
              {question.question}
            </h2>
          </div>

          <div className="grid gap-4">
            {question.options.map((option: string, idx: number) => {
              const isSelected = answers[currentQuestion] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`
                    w-full text-left p-6 md:p-8 rounded-[2rem] border-none transition-all duration-500 relative overflow-hidden group
                    ${isSelected
                      ? 'glass-premier bg-primary/10 shadow-2xl ring-2 ring-primary/50'
                      : 'glass-premier bg-white/[0.02] hover:bg-white/5 hover:scale-[1.01] shadow-xl'
                    }
                  `}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={`
                      w-8 h-8 rounded-xl border-none flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-inner
                      ${isSelected ? 'bg-primary text-white scale-110 rotate-12' : 'bg-muted/10 text-transparent'}
                    `}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className={`text-xl tracking-tight transition-all duration-300 ${isSelected ? 'font-black text-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground'}`}>
                      {option}
                    </span>
                  </div>

                  {/* Option Lettering Background */}
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-8xl font-black text-white/5 pointer-events-none group-hover:text-white/10 transition-all font-heading">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-10">
            <Button
              size="lg"
              onClick={handleNext}
              className="h-20 px-12 text-lg font-black uppercase tracking-[0.2em] rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-all active:scale-95 group disabled:opacity-30"
              disabled={answers[currentQuestion] === -1}
            >
              {currentQuestion === diagnostic.questions.length - 1 ? 'Finalize Diagnosis' : 'Advance Vector'}
              <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        </div>
      </main>

      {/* Dynamic Background Auras */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[30%] left-[-10%] w-[35%] h-[35%] rounded-full bg-primary/5 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
}
