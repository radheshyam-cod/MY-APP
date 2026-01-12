import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut, Home, Upload, Calendar, TrendingUp, Settings } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  currentPage?: string;
}

export function Navbar({ user, onLogout, currentPage }: NavbarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-premier border-b-primary/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="bg-primary/10 p-2 rounded-2xl group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-6 shadow-inner">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-black tracking-tighter premium-text-gradient font-heading">ConceptPulse</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {[
                { path: '/dashboard', label: 'Dashboard', icon: Home },
                { path: '/upload', label: 'Material', icon: Upload },
                { path: '/revision', label: 'Recall', icon: Calendar },
                { path: '/progress', label: 'Insights', icon: TrendingUp },
              ].map((item) => (
                <Link to={item.path} key={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2.5 h-11 px-5 rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest ${isActive(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.path) ? 'text-primary' : ''}`} />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-foreground font-heading tracking-tight">{user?.name || 'Scholar'}</p>
              <div className="flex items-center gap-1.5 justify-end">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Class {user?.class || 'N/A'} {user?.exam_type !== 'None' && `• ${user?.exam_type}`}
                </p>
              </div>
            </div>
            <Link to="/settings">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-2.5 h-10 px-5 rounded-2xl font-bold text-[10px] uppercase tracking-widest border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-500/5 group"
            >
              <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
