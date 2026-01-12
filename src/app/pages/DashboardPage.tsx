import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { api } from '../../lib/supabase';
import { Clock, TrendingUp, Flame, ArrowRight, Upload, PlayCircle, BarChart3, AlertCircle, BookOpen, Sparkles, Target, Rocket, PartyPopper, Star } from 'lucide-react';

interface DashboardPageProps {
  user: any;
  token: string;
  onLogout: () => void;
}

// Progress Ring Component
function ProgressRing({ progress, size = 80, strokeWidth = 8, color = 'stroke-violet-500' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={`${color} transition-all duration-1000 ease-out`}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export function DashboardPage({ user, token, onLogout }: DashboardPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [weakConcepts, setWeakConcepts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashboardData, weakConceptsData] = await Promise.all([
        api.getDashboard(token),
        api.getWeakConcepts(token),
      ]);

      setStats(dashboardData);
      setWeakConcepts(weakConceptsData.weakConcepts || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const streak = stats?.streak || 0;
  const progress = stats?.masteryProgress || 0;
  const revisions = stats?.upcomingRevisionsCount || 0;
  const weakCount = stats?.weakConceptsCount || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar user={user} onLogout={onLogout} />
        <div className="max-w-7xl mx-auto p-8 flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-medium">Loading your learning space...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-transparent text-foreground font-sans selection:bg-primary/20">
      <Navbar user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Today's Focus Section */}
        <div className="mb-8 animate-fade-in-up">
          <Card className="relative overflow-hidden border-none rounded-3xl shadow-2xl shadow-violet-500/25">
            {/* Premium Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600"></div>
            {/* Mesh Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.1)_0%,_transparent_50%)]"></div>
            {/* Shimmer Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

            <CardContent className="relative p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="text-white space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Today's Focus
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {greeting}, {firstName}
                  </h1>
                  <p className="text-white/85 text-lg max-w-xl leading-relaxed">
                    {revisions > 0
                      ? `You have ${revisions} topic${revisions > 1 ? 's' : ''} ready for revision. Let's keep that momentum going.`
                      : streak > 0
                        ? `${streak}-day streak active. Continue to maintain it.`
                        : `System ready. Upload your first notes to begin analysis.`
                    }
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(revisions > 0 ? '/revision' : '/upload')}
                    className="bg-white text-violet-700 hover:bg-white/95 font-bold rounded-2xl h-14 px-8 shadow-xl shadow-black/10 hover:shadow-2xl transition-all hover:-translate-y-0.5"
                  >
                    {revisions > 0 ? 'Start Revision' : 'Upload Notes'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Stats with Rings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* Your Progress - Ring */}
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover-lift border border-slate-200/50 dark:border-slate-700/50 shadow-soft rounded-2xl animate-fade-in-up">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ProgressRing progress={progress} color="stroke-emerald-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{progress}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Your Progress</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    {progress === 0 ? 'Awaiting first diagnostic input' : progress < 50 ? 'System calibrating' : 'Optimal retention detected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Streak - Special */}
          <Card className={`${streak > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800' : 'bg-white/90 dark:bg-slate-800/90'} backdrop-blur-sm hover-lift border border-slate-200/50 dark:border-slate-700/50 shadow-soft rounded-2xl animate-fade-in-up stagger-1`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${streak > 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <Flame className={`w-8 h-8 ${streak > 0 ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Study Streak</p>
                  {streak > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
                      <p className="text-amber-600 dark:text-amber-400 font-semibold text-xs mt-1">On fire</p>
                    </>
                  ) : (
                    <p className="text-violet-600 dark:text-violet-400 font-semibold text-sm">
                      Ready to initialize
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topics to Review */}
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover-lift border border-slate-200/50 dark:border-slate-700/50 shadow-soft rounded-2xl animate-fade-in-up stagger-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${weakCount > 0 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                  {weakCount > 0 ? (
                    <Target className="w-8 h-8 text-rose-500" />
                  ) : (
                    <Star className="w-8 h-8 text-emerald-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Focus Areas</p>
                  {weakCount > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{weakCount} Topics</p>
                      <p className="text-rose-600 dark:text-rose-400 font-semibold text-xs mt-1">Need your attention</p>
                    </>
                  ) : (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      Systems optimal
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revisions Due */}
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover-lift border border-slate-200/50 dark:border-slate-700/50 shadow-soft rounded-2xl animate-fade-in-up stagger-3">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${revisions > 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <Clock className={`w-8 h-8 ${revisions > 0 ? 'text-blue-500' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Ready to Revise</p>
                  {revisions > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{revisions} Topics</p>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-1">Ready to practice</p>
                    </>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                      Queue clear
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6 animate-fade-in-up stagger-4">

            {/* Priority Concepts */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-soft rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Topics to Practice</h2>
                  </div>
                </div>
              </div>
              <CardContent className="p-0">
                {weakConcepts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25 animate-bounce-soft">
                      <PartyPopper className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">All systems nominal</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                      Diagnostic complete. Upload new material to continue analysis.
                    </p>
                    <Button
                      onClick={() => navigate('/upload')}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-violet-500/25 btn-glow"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Notes
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {weakConcepts.slice(0, 3).map((concept, idx) => (
                      <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {concept.subject}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                              {Math.round(concept.score)}% mastery
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {concept.topic}
                          </h3>
                        </div>
                        <Button
                          onClick={() => navigate(`/correction/${encodeURIComponent(concept.topic)}`)}
                          size="sm"
                          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl h-10 px-5"
                        >
                          Practice
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ))}
                    {weakConcepts.length > 3 && (
                      <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/50">
                        <Button variant="ghost" className="text-violet-600 dark:text-violet-400 font-semibold text-sm">
                          View all {weakConcepts.length} topics
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6 animate-fade-in-up stagger-5">

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">Quick Actions</h3>
              {[
                { label: 'Upload Notes', desc: 'Add study material', icon: Upload, path: '/upload', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                { label: 'Start Revision', desc: 'Practice topics', icon: PlayCircle, path: '/revision', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
                { label: 'View Progress', desc: 'Track growth', icon: BarChart3, path: '/progress', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
              ].map((tool, i) => (
                <button
                  key={i}
                  onClick={() => navigate(tool.path)}
                  className="w-full group flex items-center gap-4 p-4 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover-lift shadow-soft text-left"
                >
                  <div className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-xl ${tool.color}`}>
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors text-sm">{tool.label}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Motivational Card */}
            <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200/50 dark:border-violet-800/50 shadow-soft rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-violet-800 dark:text-violet-200">Daily Tip</p>
                    <p className="text-xs text-violet-600 dark:text-violet-400">Keep learning!</p>
                  </div>
                </div>
                <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
                  "Small steps every day lead to big achievements. You're doing great! 🌟"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-200/30 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-indigo-200/30 blur-[100px]"></div>
      </div>
    </div>
  );
}
