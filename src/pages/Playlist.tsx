import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppShell from '@/components/AppShell';
import { useBroadcast, useQueue, useSettings, useTracks, formatTime, Track } from '@/lib/broadcastStore';

const Playlist = () => {
  const [tracks, setTracks] = useTracks();
  const [queue, setQueue] = useQueue();
  const [state, setState] = useBroadcast();
  const [settings] = useSettings();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('Все');

  const genres = useMemo(() => ['Все', ...Array.from(new Set(tracks.map((t) => t.genre)))], [tracks]);

  const filtered = useMemo(() => {
    return tracks.filter((t) => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.artist.toLowerCase().includes(search.toLowerCase());
      const matchGenre = filter === 'Все' || t.genre === filter;
      return matchSearch && matchGenre;
    });
  }, [tracks, search, filter]);

  const toggleQueue = (id: string) => {
    setQueue((q) => (q.includes(id) ? q.filter((x) => x !== id) : [...q, id]));
  };

  const playNow = (id: string) => {
    setState((s) => ({ ...s, currentTrackId: id, isLive: true }));
    if (settings.sendMetadata) {
      const t = tracks.find((x) => x.id === id);
      if (t) toast.success('В эфир', { description: `${t.artist} — ${t.title}` });
    }
  };

  const addRandom = () => {
    const covers = ['🎶', '🔥', '💫', '🌊', '🚀', '🎸', '🎹', '🥁'];
    const genres = ['Synthwave', 'House', 'Techno', 'Ambient', 'Drum & Bass'];
    const newTrack: Track = {
      id: Math.random().toString(36).slice(2, 9),
      title: `New Track ${tracks.length + 1}`,
      artist: 'Unknown Artist',
      duration: 180 + Math.floor(Math.random() * 120),
      cover: covers[Math.floor(Math.random() * covers.length)],
      genre: genres[Math.floor(Math.random() * genres.length)],
    };
    setTracks((t) => [newTrack, ...t]);
    toast.success('Трек добавлен в библиотеку');
  };

  return (
    <AppShell>
      <div className="px-5 pt-4 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl gradient-text leading-none">Плейлист</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {queue.length} в очереди • {tracks.length} в библиотеке
              </p>
            </div>
            <Button onClick={addRandom} size="sm" className="gradient-bg-cyan text-background font-semibold">
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить
            </Button>
          </div>

          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск треков..."
              className="pl-9 glass border-white/10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all ${
                  filter === g ? 'gradient-bg text-white neon-glow-purple' : 'glass text-muted-foreground'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {queue.length > 0 && (
          <div className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="ListOrdered" size={16} className="text-secondary" />
              <h3 className="text-xs uppercase tracking-widest font-mono text-secondary">Очередь эфира</h3>
            </div>
            <div className="space-y-2">
              {queue.map((id, idx) => {
                const t = tracks.find((x) => x.id === id);
                if (!t) return null;
                const isCurrent = state.currentTrackId === id;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 p-2 rounded-xl ${
                      isCurrent ? 'bg-primary/20 border border-primary/40' : 'bg-black/20'
                    }`}
                  >
                    <span className="font-mono text-xs w-5 text-center text-muted-foreground">{idx + 1}</span>
                    <span className="text-xl">{t.cover}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{t.artist}</div>
                    </div>
                    {isCurrent && state.isLive && (
                      <div className="flex items-end gap-0.5 h-4">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-secondary wave-bar"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => toggleQueue(id)}
                      className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"
                    >
                      <Icon name="X" size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest font-mono text-muted-foreground px-1">Библиотека</h3>
          {filtered.map((t) => {
            const inQueue = queue.includes(t.id);
            const isCurrent = state.currentTrackId === t.id;
            return (
              <div
                key={t.id}
                className={`glass rounded-2xl p-3 flex items-center gap-3 transition-all ${
                  isCurrent ? 'border-primary/50 neon-glow-purple' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-2xl shrink-0">
                  {t.cover}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.artist} • {t.genre}
                  </div>
                  <div className="text-[10px] font-mono text-secondary mt-0.5">{formatTime(t.duration)}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => playNow(t.id)}
                    className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <Icon name="Play" size={14} className="text-white ml-0.5" />
                  </button>
                  <button
                    onClick={() => toggleQueue(t.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      inQueue ? 'bg-secondary text-background' : 'glass'
                    }`}
                  >
                    <Icon name={inQueue ? 'Check' : 'Plus'} size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-12 text-sm">Ничего не найдено</div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Playlist;
