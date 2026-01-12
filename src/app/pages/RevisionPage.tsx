import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { api } from '../../lib/supabase';
import { Calendar, CheckCircle, Clock, Flame, ArrowRight, Brain, Sparkles, PartyPopper, Target, Upload } from 'lucide-react';

interface RevisionPageProps {
  user: any;
  token: string;
  onLogout: () => void;
}

export function RevisionPage({ user, token, onLogout }: RevisionPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [recallScore, setRecallScore] = useState([5]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadRevisions();
  }, []);

  const loadRevisions = async () => {
    try {
      const { revisions: revData, error } = await api.getRevisions(token);
      if (error) {
        toast.error(error);
      } else {
        setRevisions(revData || []);
      }
    } catch (err) {
      toast.error('Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedRevision) return;

    try {
      const { error } = await api.completeRevision(
        token,
        selectedRevision.id,
        recallScore[0]
      );

      if (error) {
        toast.error(error);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          toast.success('Great work. You\'re building stronger memory.');
          setSelectedRevision(null);
          setRecallScore([5]);
          setShowSuccess(false);
          loadRevisions();
        }, 2000);
      }
    } catch (err) {
      toast.error('Something went wrong. Try again!');
    }
  };

  // Get encouragement based on score
  const getScoreMessage = (score: number) => {
    if (score >= 8) return { text: "Excellent recall", color: "text-emerald-500" };
    if (score >= 5) return { text: "Good progress", color: "text-amber-500" };
    return { text: "Keep practicing", color: "text-rose-500" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        <p className="mt-4 text-slate-500">Loading your revisions...</p>
      </div>
    );
  }

  // SUCCESS ANIMATION OVERLAY
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30 animate-bounce">
            <PartyPopper className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Excellent work</h1>
          <p className="text-xl text-slate-500 dark:text-slate-400">You're building stronger memory every day!</p>
          <div className="mt-8 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE REVISION QUIZ MODE
  if (selectedRevision) {
    const scoreMessage = getScoreMessage(recallScore[0]);

    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center animate-fade-in-up">

          <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Flame className="w-4 h-4" />
                  Day {selectedRevision.revision_day} Streak
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Clock className="w-4 h-4" />
                  ~2 min
                </div>
              </div>
              <h2 className="text-2xl font-bold">{selectedRevision.topic}</h2>
              <p className="text-white/80 text-sm mt-1">{selectedRevision.subject}</p>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Recall Challenge */}
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-violet-800 dark:text-violet-200 mb-2">Quick Recall Challenge</p>
                    <p className="text-violet-600 dark:text-violet-400 text-sm leading-relaxed">
                      Without looking at your notes, try to explain <span className="font-bold">{selectedRevision.topic}</span> in your own words. What are the key points?
                    </p>
                  </div>
                </div>
              </div>

              {/* Helpful Tips */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Think about:</p>
                <div className="space-y-2">
                  {[
                    "The main idea or formula",
                    "How it applies in real life",
                    "Any tricky parts you remember"
                  ].map((tip, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className="w-2 h-2 bg-violet-400 rounded-full" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Slider */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">How well did you remember?</Label>
                    <p className="text-xs text-slate-500 mt-1">Be honest - it helps us help you!</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-bold ${scoreMessage.color}`}>
                      {recallScore[0]}<span className="text-lg opacity-50">/10</span>
                    </span>
                    <p className={`text-sm font-medium ${scoreMessage.color}`}>{scoreMessage.text}</p>
                  </div>
                </div>
                <Slider
                  value={recallScore}
                  onValueChange={setRecallScore}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Struggled</span>
                  <span>Okay</span>
                  <span>Perfect</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRevision(null)}
                  className="h-12 flex-1 rounded-xl font-semibold border-slate-300 dark:border-slate-600"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleComplete}
                  className="h-12 flex-[2] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-violet-500/25 group btn-glow"
                >
                  Complete Revision
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // REVISION LIST VIEW
  return (
    <div className="min-h-screen bg-transparent font-sans">
      <Navbar user={user} onLogout={onLogout} />

      <main className="max-w-3xl mx-auto p-6 md:p-12 relative z-10">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Daily Practice
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
            Time to Revise
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
            {revisions.length > 0
              ? `You have ${revisions.length} topic${revisions.length > 1 ? 's' : ''} to review. Let's strengthen your memory!`
              : "Revision queue is clear. System ready for next cycle."}
          </p>
        </div>

        {/* Topics Count Badge */}
        {revisions.length > 0 && (
          <div className="flex justify-center mb-8 animate-fade-in-up stagger-1">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800 px-6 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-200">{revisions.length} topic{revisions.length > 1 ? 's' : ''} ready</p>
                <p className="text-amber-600 dark:text-amber-400 text-sm">Complete them to keep your streak going</p>
              </div>
            </div>
          </div>
        )}

        {revisions.length === 0 ? (
          <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-3xl overflow-hidden animate-fade-in-up stagger-2">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/25">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Revision cycle complete</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
                All scheduled diagnostics processed. Next retention check scheduled for tomorrow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/upload')} variant="outline" className="h-12 px-6 rounded-xl font-semibold border-violet-300 text-violet-600 hover:bg-violet-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload New Notes
                </Button>
                <Button onClick={() => navigate('/dashboard')} className="h-12 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-fade-in-up stagger-2">
            {revisions.map((revision: any, i: number) => (
              <Card
                key={revision.id}
                className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover-lift"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {revision.subject}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        <Flame className="w-3 h-3" />
                        Day {revision.revision_day}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{revision.topic}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Takes about 2 minutes
                    </p>
                  </div>
                  <Button
                    onClick={() => setSelectedRevision(revision)}
                    className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-md group"
                  >
                    Start
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-200/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-200/30 blur-[100px]"></div>
      </div>
    </div>
  );
}

