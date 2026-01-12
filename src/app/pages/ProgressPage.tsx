import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../../lib/supabase';
import { TrendingUp, Award, Zap, BookOpen, Sparkles, Target, Lightbulb, CheckCircle, ArrowUp, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ProgressPageProps {
  user: any;
  token: string;
  onLogout: () => void;
}

export function ProgressPage({ user, token, onLogout }: ProgressPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { progress: progressData } = await api.getProgress(token);
      setProgress(progressData || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'mastered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'improving': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
      case 'learning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getMasteryLabel = (level: string) => {
    switch (level) {
      case 'mastered': return 'Mastered';
      case 'improving': return 'Improving';
      case 'learning': return 'Learning';
      default: return 'New';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        <p className="mt-4 text-slate-500">Loading your progress...</p>
      </div>
    );
  }

  const masteredCount = progress.filter(p => p.mastery_level === 'mastered').length;
  const learningCount = progress.filter(p => p.mastery_level === 'learning').length;
  const improvingCount = progress.filter(p => p.mastery_level === 'improving').length;
  const totalTopics = progress.length;
  const avgRecall = progress.length > 0 ? Math.round(progress.reduce((acc, curr) => acc + (curr.day1_score || 0), 0) / progress.length) : 0;

  // Transform data for charts
  const chartData = progress.filter(p => p.day1_score || p.day7_score).map(p => ({
    name: p.topic.substring(0, 8) + (p.topic.length > 8 ? '...' : ''),
    fullTopic: p.topic,
    day1: p.day1_score || 0,
    day7: p.day7_score || p.day3_score || 0
  }));

  // Calculate improvement
  const hasImproved = chartData.some(d => d.day7 > d.day1);
  const avgImprovement = chartData.length > 0
    ? Math.round(chartData.reduce((acc, d) => acc + (d.day7 - d.day1), 0) / chartData.length)
    : 0;

  // Get insight message
  const getInsightMessage = () => {
    if (totalTopics === 0) return "Upload notes to activate the analysis engine.";
    if (masteredCount > totalTopics / 2) return "You're doing excellently. More than half your topics are mastered.";
    if (avgRecall >= 70) return "Strong recall scores. You're retaining most of what you study.";
    if (avgImprovement > 0) return "Your scores are improving over time. Keep revising.";
    return "Keep practicing. Every revision makes you stronger.";
  };

  return (
    <div className="min-h-screen bg-transparent font-sans">
      <Navbar user={user} onLogout={onLogout} />

      <main className="max-w-4xl mx-auto p-6 md:p-12 relative z-10">

        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Your Progress
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">
            Your Progress
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
            Here's a simple overview of your learning journey so far.
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up stagger-1">
          {[
            { label: "Topics Studied", value: totalTopics, icon: BookOpen, color: "violet" },
            { label: "Mastered", value: masteredCount, icon: Award, color: "emerald" },
            { label: "In Progress", value: learningCount + improvingCount, icon: Target, color: "amber" },
            { label: "Avg. Score", value: `${avgRecall}%`, icon: TrendingUp, color: "indigo" }
          ].map((stat, i) => (
            <Card key={i} className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stat.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What This Means Section */}
        <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl mb-8 animate-fade-in-up stagger-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-violet-800 dark:text-violet-200 mb-1">What this means for you</h3>
                <p className="text-violet-600 dark:text-violet-400 leading-relaxed">
                  {getInsightMessage()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Progress Chart */}
          <Card className="lg:col-span-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden animate-fade-in-up stagger-3">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                📊 Your Memory Over Time
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Compare your first try vs. later revisions
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="h-[280px] w-full">
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                        <Tooltip
                          cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                          contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            padding: '12px'
                          }}
                          formatter={(value: number, name: string) => [
                            `${value}%`,
                            name === 'day1' ? 'First Try' : 'After Practice'
                          ]}
                        />
                        <Bar dataKey="day1" name="First Try" fill="#c4b5fd" radius={[6, 6, 0, 0]} barSize={20} />
                        <Bar dataKey="day7" name="After Practice" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Chart Interpretation */}
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-white">Reading this chart:</span> The <span className="text-violet-400 font-medium">light purple</span> bars show your first attempt. The <span className="text-violet-600 font-medium">dark purple</span> bars show how much you remember after practicing.
                        {avgImprovement > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-medium"> You're improving by about {avgImprovement}% on average.</span>}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Awaiting diagnostic input</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                        Complete revisions to generate retention curves.
                      </p>
                    </div>
                    <Button onClick={() => navigate('/upload')} className="mt-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Notes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Topic List */}
          <Card className="lg:col-span-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden animate-fade-in-up stagger-4">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Your Topics
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                How you're doing in each area
              </p>
            </CardHeader>
            <CardContent className="p-4 max-h-[380px] overflow-y-auto">
              {progress.length > 0 ? (
                <div className="space-y-3">
                  {progress.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{item.topic}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.subject}</p>
                      </div>
                      <Badge className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg ${getMasteryColor(item.mastery_level)}`}>
                        {getMasteryLabel(item.mastery_level)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Ready to analyze</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Topics will populate after initial upload
                  </p>
                  <Button onClick={() => navigate('/upload')} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                    Upload Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        {progress.length > 0 && (
          <Card className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-fade-in-up stagger-5">
            <CardContent className="p-6">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                <ArrowUp className="w-5 h-5" />
                Tips to improve faster
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-emerald-700 dark:text-emerald-300">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Revise daily</strong> — Short, frequent sessions beat long cramming</p>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Focus on "Learning"</strong> — Topics still in progress need more attention</p>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Be honest</strong> — Rate yourself accurately to get better recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-200/30 blur-[140px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-200/30 blur-[120px]"></div>
      </div>
    </div>
  );
}

