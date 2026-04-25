import { useMemo } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import AppShell from '@/components/AppShell';
import AudioVisualizer from '@/components/AudioVisualizer';
import { useBroadcast, useQueue, useSettings, useTracks, formatUptime, formatTime } from '@/lib/broadcastStore';

const Index = () => {
  const [state, setState] = useBroadcast();
  const [tracks] = useTracks();
  const [queue] = useQueue();
  const [settings] = useSettings();

  const currentTrack = useMemo(() => {
    const id = state.currentTrackId ?? queue[0];
    return tracks.find((t) => t.id === id) ?? tracks[0];
  }, [state.currentTrackId, queue, tracks]);

  const toggleLive = () => {
    if (!state.isLive) {
      if (!settings.password) {
        toast.error('Сначала укажи пароль источника в настройках');
        return;
      }
      setState((s) => ({
        ...s,
        isLive: true,
        currentTrackId: currentTrack?.id ?? null,
        listeners: 1,
        uptime: 0,
      }));
      toast.success('Эфир запущен', {
        description: `${settings.stationName} • ${settings.bitrate} kbps`,
      });
    } else {
      setState((s) => ({ ...s, isLive: false, listeners: 0 }));
      toast('Эфир остановлен');
    }
  };

  const skipNext = () => {
    if (!currentTrack) return;
    const idx = queue.indexOf(currentTrack.id);
    const nextId = queue[(idx + 1) % queue.length];
    setState((s) => ({ ...s, currentTrackId: nextId }));
    if (settings.sendMetadata) {
      const next = tracks.find((t) => t.id === nextId);
      if (next) toast.success('Метаданные обновлены', { description: `${next.artist} — ${next.title}` });
    }
  };

  return (
    <AppShell>
      <div className="px-5 pt-4 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="Users" label="Слушатели" value={state.listeners.toString()} color="cyan" />
          <StatCard icon="Timer" label="В эфире" value={formatUptime(state.uptime)} color="purple" mono />
          <StatCard icon="Activity" label="Битрейт" value={`${settings.bitrate}`} color="pink" suffix="kbps" />
        </div>

        <div className="relative glass rounded-3xl p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-accent blur-3xl" />
          </div>

          <div className="relative space-y-5">
            <div className="flex items-center gap-4">
              <div
                className={`relative w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center text-4xl shadow-xl ${
                  state.isLive ? 'spin-slow' : 'float'
                }`}
              >
                {currentTrack?.cover ?? '🎧'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-secondary font-mono mb-1">
                  Сейчас в эфире
                </p>
                <h2 className="font-display text-2xl leading-tight truncate">{currentTrack?.title ?? '—'}</h2>
                <p className="text-sm text-muted-foreground truncate">{currentTrack?.artist ?? '—'}</p>
              </div>
            </div>

            <AudioVisualizer active={state.isLive} />

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                className="w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform"
                onClick={skipNext}
              >
                <Icon name="SkipBack" size={20} />
              </button>

              <button
                onClick={toggleLive}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  state.isLive ? 'bg-red-500 neon-glow-pink' : 'gradient-bg neon-glow-purple'
                } hover:scale-105 active:scale-95`}
              >
                {state.isLive && <span className="absolute inset-0 rounded-full bg-red-500/40 pulse-ring" />}
                <Icon name={state.isLive ? 'Square' : 'Mic'} size={32} className="text-white relative" />
              </button>

              <button
                className="w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform"
                onClick={skipNext}
              >
                <Icon name="SkipForward" size={20} />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>0:00</span>
                <span>{formatTime(currentTrack?.duration ?? 0)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden relative">
                <div
                  className={`h-full gradient-bg ${state.isLive ? 'shimmer' : ''}`}
                  style={{ width: state.isLive ? '45%' : '0%', transition: 'width 1s linear' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Volume2" size={18} className="text-secondary" />
              <span className="text-sm font-medium">Громкость</span>
            </div>
            <span className="font-mono text-sm text-secondary">{state.volume}%</span>
          </div>
          <Slider
            value={[state.volume]}
            onValueChange={(v) => setState((s) => ({ ...s, volume: v[0] }))}
            max={100}
            step={1}
          />
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Tag" size={18} className="text-accent" />
              <span className="text-sm font-medium">Метаданные</span>
            </div>
            <span
              className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full ${
                settings.sendMetadata ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'
              }`}
            >
              {settings.sendMetadata ? 'Live Sync' : 'Off'}
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground bg-black/30 rounded-lg p-3 space-y-1">
            <div>
              <span className="text-secondary">artist:</span> {currentTrack?.artist ?? '—'}
            </div>
            <div>
              <span className="text-secondary">title:</span> {currentTrack?.title ?? '—'}
            </div>
            <div>
              <span className="text-secondary">genre:</span> {currentTrack?.genre ?? '—'}
            </div>
            <div>
              <span className="text-secondary">station:</span> {settings.stationName}
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-secondary/40 hover:bg-secondary/10 hover:text-secondary"
            onClick={() => {
              if (currentTrack) {
                toast.success('Метаданные отправлены слушателям', {
                  description: `${currentTrack.artist} — ${currentTrack.title}`,
                });
              }
            }}
          >
            <Icon name="Send" size={16} className="mr-2" />
            Обновить вручную
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

function StatCard({
  icon,
  label,
  value,
  color,
  suffix,
  mono,
}: {
  icon: string;
  label: string;
  value: string;
  color: 'cyan' | 'purple' | 'pink';
  suffix?: string;
  mono?: boolean;
}) {
  const colors: Record<string, string> = {
    cyan: 'text-secondary',
    purple: 'text-primary',
    pink: 'text-accent',
  };
  return (
    <div className="glass rounded-2xl p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon name={icon} size={14} className={colors[color]} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`${mono ? 'font-mono' : 'font-display'} text-lg leading-none`}>
        {value}
        {suffix && <span className="text-[10px] ml-1 text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

export default Index;
