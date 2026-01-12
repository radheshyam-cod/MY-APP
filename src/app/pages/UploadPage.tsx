import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { api } from '../../lib/supabase';
import { Upload, FileText, X, CheckCircle2, ArrowRight, Sparkles, Zap, Brain, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface UploadPageProps {
  user: any;
  token: string;
  onLogout: () => void;
}

// Default subjects fallback
const ALL_SUBJECTS = [
  "Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science", "History", "Geography", "Economics", "Other"
];

export function UploadPage({ user, token, onLogout }: UploadPageProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filter subjects based on exam type
  const getSubjects = () => {
    const examType = user?.exam_type;
    if (examType === 'JEE') return ["Physics", "Chemistry", "Mathematics"];
    if (examType === 'NEET') return ["Physics", "Chemistry", "Zoology", "Biology"];
    if (examType === 'Both') return ["Physics", "Chemistry", "Mathematics", "Zoology", "Biology"];
    return ALL_SUBJECTS;
  };

  const subjects = getSubjects();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        toast.success('File added');
      } else {
        toast.error('Please upload a PDF or Image file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success('File added! 📄');
    }
  };

  const removeFile = () => setFile(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject || !topic) {
      toast.error('Please fill all fields');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 10;
      });
    }, 200);

    try {
      const { error, detectedTopic } = await api.uploadNote(token, file, subject, topic);
      if (error) {
        toast.error(error);
        setIsLoading(false);
        clearInterval(interval);
      } else {
        setUploadProgress(100);
        setTimeout(() => {
          toast.success('Analysis complete. Redirecting to insights.');
          const finalTopic = detectedTopic || topic;
          navigate(`/diagnosis/${encodeURIComponent(finalTopic)}?subject=${encodeURIComponent(subject)}`);
        }, 500);
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again!');
      setIsLoading(false);
      clearInterval(interval);
    }
  };

  // Calculate completion
  const step1Done = !!subject;
  const step2Done = !!topic;
  const step3Done = !!file;
  const allDone = step1Done && step2Done && step3Done;

  return (
    <div className="min-h-screen bg-transparent text-foreground font-sans selection:bg-primary/20">
      <Navbar user={user} onLogout={onLogout} />

      <main className="max-w-2xl mx-auto p-6 lg:p-12 relative z-10">

        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-600 dark:text-violet-400 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Upload Study Material
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
            Upload Your Notes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
            Drop your notes and we'll analyze them to find your strengths and areas to improve!
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in-up stagger-1">
          {[
            { label: 'Subject', done: step1Done },
            { label: 'Topic', done: step2Done },
            { label: 'File', done: step3Done },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step.done
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                {step.done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${step.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {step.label}
              </span>
              {i < 2 && <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700"></div>}
            </div>
          ))}
        </div>

        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-3xl overflow-hidden animate-fade-in-up stagger-2">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Subject & Topic Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    Subject
                    {step1Done && <Check className="w-4 h-4 text-emerald-500" />}
                  </Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger id="subject" className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:border-violet-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all">
                      <SelectValue placeholder="Choose subject..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                      {subjects.map(s => (
                        <SelectItem key={s} value={s} className="rounded-lg font-medium py-2.5 px-3 focus:bg-violet-50 dark:focus:bg-violet-900/20">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    Topic
                    {step2Done && <Check className="w-4 h-4 text-emerald-500" />}
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g. Newton's Laws"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:border-violet-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>

              {/* File Upload Zone */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Your Notes
                  {step3Done && <Check className="w-4 h-4 text-emerald-500" />}
                </Label>

                {!file ? (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`
                      relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
                      ${isDragging
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02] shadow-xl shadow-violet-500/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                      }
                    `}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept="application/pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${isDragging
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white scale-110 rotate-3 shadow-lg'
                        : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                        }`}>
                        <Upload className={`w-8 h-8 transition-transform ${isDragging ? 'animate-bounce' : ''}`} />
                      </div>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                        {isDragging ? 'Release to upload' : 'Drop your notes here'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        or click to browse • PDF or Image files
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                          <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-lg truncate max-w-[200px] sm:max-w-xs">
                            {file.name}
                          </p>
                          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Ready to analyze • {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        disabled={isLoading}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* What Happens Next */}
              {allDone && !isLoading && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-5 animate-fade-in-up">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-violet-800 dark:text-violet-200 mb-1">What happens next</p>
                      <p className="text-violet-600 dark:text-violet-400 text-sm leading-relaxed">
                        Our AI will scan your notes, generate practice questions, identify key concepts, and show you exactly what you've mastered and what needs review!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-6 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <p className="font-bold text-violet-800 dark:text-violet-200">Analyzing your notes...</p>
                        <p className="text-violet-600 dark:text-violet-400 text-sm">
                          {uploadProgress < 30 ? 'Reading content...' : uploadProgress < 60 ? 'Extracting concepts...' : uploadProgress < 90 ? 'Generating insights...' : 'Almost done!'}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  {uploadProgress === 100 && (
                    <p className="text-center text-emerald-600 dark:text-emerald-400 font-semibold mt-4 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Analysis complete! Redirecting...
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-xl font-semibold border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => navigate('/dashboard')}
                  disabled={isLoading}
                >
                  Back to Dashboard
                </Button>
                <Button
                  type="submit"
                  className={`h-12 flex-[2] rounded-xl font-semibold transition-all duration-300 group ${allDone
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl btn-glow'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  disabled={isLoading || !allDone}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analyzing...
                    </span>
                  ) : allDone ? (
                    <span className="flex items-center gap-2">
                      Start Analysis
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  ) : (
                    'Complete all fields to continue'
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </main>

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[30%] w-[40%] h-[40%] rounded-full bg-violet-200/30 blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-200/30 blur-[100px]"></div>
      </div>
    </div>
  );
}

