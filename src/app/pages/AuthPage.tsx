import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { api } from '../../lib/supabase';
import { Lightbulb, BarChart3, Brain, Eye, EyeOff, Lock, Mail, User, ArrowRight, Shield, GraduationCap } from 'lucide-react';

interface AuthPageProps {
  onAuth: (token: string, user: any) => void;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const classes = ['9', '10', '11', '12', 'College'];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords don\'t match. Please try again.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password should be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const { user, error } = await api.signup(email, password, name);

      if (error) {
        toast.error(error);
        setIsLoading(false);
        return;
      }

      const signInResponse = await api.signin(email, password);
      if (signInResponse.error) {
        toast.error(signInResponse.error);
      } else {
        toast.success('🎉 Welcome to Concept Pulse! Let\'s get started.');
        onAuth(signInResponse.session?.access_token || '', signInResponse.user);
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { session, user, error } = await api.signin(email, password);

      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome back! 👋');
        onAuth(session?.access_token || '', user);
      }
    } catch (err) {
      toast.error('Unable to sign in. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: '', color: '', width: '0%' };
    if (pass.length < 6) return { label: 'Too short', color: 'bg-red-400', width: '25%' };
    if (pass.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '50%' };
    if (pass.length < 12) return { label: 'Good', color: 'bg-emerald-400', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">

      {/* Soft Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50"></div>
        {/* Subtle floating orbs */}
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] rounded-full bg-violet-200/40 blur-[80px]"></div>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-indigo-100/30 blur-[60px]"></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left: Brand Story */}
        <div className="hidden lg:flex flex-col justify-center space-y-10 animate-fade-in">

          {/* Logo & Name */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-slate-800 tracking-tight">Concept Pulse</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight tracking-tight">
                Understand Concepts.<br />
                Track Progress.<br />
                <span className="text-blue-600">Learn Smarter.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-md leading-relaxed">
                AI-powered learning insights to help students identify weak areas and master subjects step by step.
              </p>
            </div>
          </div>

          {/* Feature Chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Lightbulb, label: 'Concept Clarity Tracking', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { icon: BarChart3, label: 'Smart Revision Cycles', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { icon: Brain, label: 'Personalized Learning Insights', color: 'bg-violet-50 text-violet-700 border-violet-200' },
            ].map((feature, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border ${feature.color} font-medium text-sm animate-fade-in`}
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                <feature.icon className="w-4 h-4" />
                {feature.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="w-full max-w-md mx-auto">

          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">Concept Pulse</span>
            </div>
            <p className="text-slate-600">Your smart study companion ✨</p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardContent className="p-8">

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-slate-100 rounded-xl h-12">
                  <TabsTrigger
                    value="signin"
                    className="rounded-lg font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm transition-all"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-lg font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm transition-all"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="signin" className="space-y-5 animate-fade-in">
                  {/* Emotional headline */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome back! 👋</h2>
                    <p className="text-slate-500 text-sm">You're one step away from smarter learning.</p>
                  </div>
                  <form onSubmit={handleSignin} className="space-y-5">

                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        Email
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-blue-300"
                      />
                      <p className="text-xs text-slate-400 pl-1">We'll keep your learning progress safe here 🔒</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="signin-password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-400" />
                          Password
                        </Label>
                        <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 pr-12 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98] btn-glow group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Signing in...
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Let's Go! 🚀
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-slate-500 pt-2">
                    New here? <button onClick={() => setActiveTab('signup')} className="text-blue-600 font-semibold hover:underline">Create an account</button>
                  </p>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="signup" className="space-y-5 animate-fade-in">
                  {/* Emotional headline */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Start your journey! ✨</h2>
                    <p className="text-slate-500 text-sm">Join thousands of students learning smarter every day.</p>
                  </div>
                  <form onSubmit={handleSignup} className="space-y-4">

                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-blue-300"
                      />
                      <p className="text-xs text-slate-400 pl-1">What should we call you? 😊</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-blue-300"
                      />
                      <p className="text-xs text-slate-400 pl-1">Use an email you check regularly 📬</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 pr-12 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {/* Password Strength Indicator */}
                      {password.length > 0 && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }}></div>
                          </div>
                          <p className="text-xs text-slate-500">Password strength: <span className="font-medium">{passwordStrength.label}</span></p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        Confirm Password
                      </Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-class" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        Class / Year <span className="text-slate-400 font-normal">(optional)</span>
                      </Label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 text-base">
                          <SelectValue placeholder="Select your class" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                          {classes.map((c) => (
                            <SelectItem key={c} value={c} className="h-10 cursor-pointer hover:bg-slate-50">
                              {c === 'College' ? '🎓 College / University' : `📚 Class ${c}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating your account...
                        </div>
                      ) : (
                        'Create My Account'
                      )}
                    </Button>

                    {/* Privacy Note */}
                    <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                      <Shield className="w-3.5 h-3.5" />
                      Your data stays private and secure
                    </p>
                  </form>

                  <p className="text-center text-sm text-slate-500 pt-2">
                    Already have an account? <button onClick={() => setActiveTab('signin')} className="text-blue-600 font-semibold hover:underline">Log in</button>
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center mt-6 text-sm text-slate-400">
            © 2026 Concept Pulse. Made for students, by students.
          </p>
        </div>
      </div>
    </div>
  );
}
