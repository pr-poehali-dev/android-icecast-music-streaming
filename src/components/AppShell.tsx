import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useBroadcast } from '@/lib/broadcastStore';

const tabs = [
  { to: '/', label: 'Эфир', icon: 'Radio' },
  { to: '/playlist', label: 'Плейлист', icon: 'ListMusic' },
  { to: '/settings', label: 'Настройки', icon: 'Settings' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [state] = useBroadcast();

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative">
      <header className="sticky top-0 z-30 px-5 pt-6 pb-3 glass border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center neon-glow-purple">
                <Icon name="Radio" size={22} className="text-white" />
              </div>
              {state.isLive && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-background pulse-ring" />
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none gradient-text">AIRWAVE</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                Icecast Broadcaster
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass">
            <span
              className={`w-2 h-2 rounded-full ${state.isLive ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`}
            />
            <span className="text-[11px] uppercase font-mono tracking-wider">
              {state.isLive ? 'LIVE' : 'OFF AIR'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-28">{children}</main>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
        <div className="glass rounded-2xl px-2 py-2 flex items-center justify-around shadow-2xl border border-white/10">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'gradient-bg text-white neon-glow-purple' : 'text-muted-foreground hover:text-white'
                }`
              }
            >
              <Icon name={t.icon} size={20} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
