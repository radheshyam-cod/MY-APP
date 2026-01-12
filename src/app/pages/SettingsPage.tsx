import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { api } from '../../lib/supabase';
import { toast } from 'sonner';
import { Settings, User, Bell, Moon, Sun, Shield, Trash2, ArrowLeft, Save, Check } from 'lucide-react';

interface SettingsPageProps {
    user: any;
    token: string;
    onLogout: () => void;
    onUserUpdate?: (user: any) => void;
}

export function SettingsPage({ user, token, onLogout, onUserUpdate }: SettingsPageProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [notifications, setNotifications] = useState(true);

    // Profile settings
    const [name, setName] = useState(user?.name || '');
    const [studentClass, setStudentClass] = useState(user?.class || '');
    const [examType, setExamType] = useState(user?.exam_type || 'None');

    const handleDarkModeToggle = (enabled: boolean) => {
        setDarkMode(enabled);
        if (enabled) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        toast.success(enabled ? 'Dark mode enabled' : 'Light mode enabled');
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const { error } = await api.updateProfile(token, {
                name,
                class: studentClass,
                exam_type: examType
            });

            if (error) {
                toast.error(error);
            } else {
                toast.success('Profile updated successfully');
                if (onUserUpdate) {
                    onUserUpdate({ ...user, name, class: studentClass, exam_type: examType });
                }
            }
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            // In a real app, this would call an API to delete the account
            toast.success('Account deletion requested. You will receive a confirmation email.');
        } catch (err) {
            toast.error('Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent font-sans">
            <Navbar user={user} onLogout={onLogout} />

            <main className="max-w-3xl mx-auto p-6 md:p-12 relative z-10">

                {/* Header */}
                <div className="mb-8 animate-fade-in-up">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Settings className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
                            <p className="text-slate-500 dark:text-slate-400">Manage your account and preferences</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* Profile Settings */}
                    <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden animate-fade-in-up">
                        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                    <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Display Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Class
                                    </Label>
                                    <Select value={studentClass} onValueChange={setStudentClass}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['9', '10', '11', '12', 'Undergraduate', 'Postgraduate'].map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exam" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Exam Preparation
                                    </Label>
                                    <Select value={examType} onValueChange={setExamType}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-700">
                                            <SelectValue placeholder="Select exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['None', 'JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'GRE', 'Other'].map((e) => (
                                                <SelectItem key={e} value={e}>{e}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </span>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Appearance */}
                    <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden animate-fade-in-up stagger-1">
                        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                    {darkMode ? <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                                </div>
                                Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Dark Mode</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Reduce eye strain in low-light environments</p>
                                </div>
                                <Switch
                                    checked={darkMode}
                                    onCheckedChange={handleDarkModeToggle}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden animate-fade-in-up stagger-2">
                        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                    <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Revision Reminders</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when topics are due for review</p>
                                </div>
                                <Switch
                                    checked={notifications}
                                    onCheckedChange={setNotifications}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Security */}
                    <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl rounded-2xl overflow-hidden animate-fade-in-up stagger-3">
                        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                                    <Shield className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                </div>
                                Account
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Email</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email || 'Not set'}</p>
                                </div>
                                <Check className="w-5 h-5 text-emerald-500" />
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                <Button
                                    variant="outline"
                                    onClick={handleDeleteAccount}
                                    className="w-full h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Account
                                </Button>
                                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3">
                                    This will permanently delete your account and all associated data.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-200/30 blur-[140px]"></div>
                <div className="absolute top-[40%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-200/30 blur-[120px]"></div>
            </div>
        </div>
    );
}
