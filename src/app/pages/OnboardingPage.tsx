import { useState } from 'react';
import { ArrowRight, Sparkles, BookOpen, Target, Rocket, GraduationCap, Check, Zap, PartyPopper } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { api } from '../../lib/supabase';

interface OnboardingPageProps {
  user: any;
  token: string;
  onComplete: (user: any) => void;
}

export function OnboardingPage({ user, token, onComplete }: OnboardingPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [examType, setExamType] = useState('');

  const classes = [
    { value: '11', label: 'Class 11', emoji: '📖' },
    { value: '12', label: 'Class 12', emoji: '🎓' },
  ];

  const exams = [
    { value: 'None', label: 'Regular School', emoji: '📚' },
    { value: 'JEE', label: 'JEE Prep', emoji: '🔬' },
    { value: 'NEET', label: 'NEET Prep', emoji: '🩺' },
    { value: 'Both', label: 'JEE + NEET', emoji: '🔥' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.error('Please select your class first!');
      return;
    }

    setIsLoading(true);
    try {
      const { user: updatedUser, error } = await api.updateProfile(token, {
        class: selectedClass,
        exam_type: examType || 'None',
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('🎉 You\'re all set! Let\'s start learning!');
        onComplete(updatedUser);
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Calculate progress
  const progress = selectedClass ? (examType ? 100 : 50) : 0;
  const currentStep = selectedClass ? 2 : 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">

      {/* 🎨 Soft Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-white to-indigo-100"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-300/30 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/30 blur-[100px]"></div>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-pink-200/20 blur-[80px]"></div>
      </div>

      <div className="w-full max-w-lg mx-auto">

        {/* Setup Card */}
        <Card className="bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-violet-500/10 rounded-3xl overflow-hidden animate-fade-in-up">

          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <CardContent className="p-8 md:p-10 space-y-8">

            {/* Step Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${selectedClass ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white'}`}>
                  {selectedClass ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="w-8 h-0.5 bg-slate-200"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${examType ? 'bg-emerald-500 text-white' : selectedClass ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {examType ? <Check className="w-4 h-4" /> : '2'}
                </div>
              </div>
              <span className="text-sm font-medium text-slate-500">
                Step {currentStep} of 2
              </span>
            </div>

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-500/25 hover:scale-105 transition-transform">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                Hey {firstName}! 👋
              </h2>
              <p className="text-slate-500 font-medium">
                Quick setup – you're almost ready to learn smarter!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Step 1: Class Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  Which class are you in?
                  {selectedClass && <span className="text-emerald-500 ml-auto flex items-center gap-1"><Check className="w-3 h-3" /> Done!</span>}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {classes.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedClass(c.value)}
                      className={`p-4 rounded-xl border-2 font-semibold text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${selectedClass === c.value
                          ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300 hover:bg-violet-50/50'
                        }`}
                    >
                      <span className="text-2xl mb-2 block">{c.emoji}</span>
                      <span className="block">{c.label}</span>
                      {selectedClass === c.value && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-violet-600 font-bold">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Exam Selection (Animated) */}
              <div className={`space-y-3 transition-all duration-500 ${selectedClass ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}>
                <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Preparing for any exam?
                  <span className="text-slate-400 font-normal">(optional)</span>
                  {examType && <span className="text-emerald-500 ml-auto flex items-center gap-1"><Check className="w-3 h-3" /> Done!</span>}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {exams.map((exam) => (
                    <button
                      key={exam.value}
                      type="button"
                      onClick={() => setExamType(exam.value)}
                      className={`p-4 rounded-xl border-2 font-semibold text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${examType === exam.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                    >
                      <span className="text-2xl mb-2 block">{exam.emoji}</span>
                      <span className="block text-sm">{exam.label}</span>
                      {examType === exam.value && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 font-bold">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Message */}
              {selectedClass && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium animate-fade-in-up">
                  <Sparkles className="w-4 h-4" />
                  Nice! You're making progress. {examType ? 'All set!' : 'One more step to go!'}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 active:scale-[0.98] group ${selectedClass
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl btn-glow'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                disabled={isLoading || !selectedClass}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Preparing your space...
                  </div>
                ) : (
                  <>
                    <PartyPopper className="mr-2 w-5 h-5 group-hover:animate-bounce" />
                    {selectedClass ? "Let's Start Learning! 🚀" : "Select your class first"}
                    {selectedClass && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </>
                )}
              </Button>

              {/* Footer */}
              <p className="text-center text-sm text-slate-400">
                ⚡ Takes less than 30 seconds • You can change this anytime
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
