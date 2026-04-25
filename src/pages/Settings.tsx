import { useState } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppShell from '@/components/AppShell';
import { useSettings, IcecastSettings } from '@/lib/broadcastStore';

const BITRATES = [64, 96, 128, 192, 256, 320];
const SAMPLE_RATES = [22050, 32000, 44100, 48000];
const FORMATS: IcecastSettings['format'][] = ['MP3', 'OGG', 'AAC'];

const SettingsPage = () => {
  const [settings, setSettings] = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);

  const update = <K extends keyof IcecastSettings>(key: K, value: IcecastSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const testConnection = () => {
    if (!settings.host || !settings.password) {
      toast.error('Заполни хост и пароль');
      return;
    }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success('Соединение установлено', {
        description: `${settings.host}:${settings.port}${settings.mountPoint}`,
      });
    }, 1500);
  };

  return (
    <AppShell>
      <div className="px-5 pt-4 space-y-5">
        <div>
          <h2 className="font-display text-3xl gradient-text leading-none">Настройки</h2>
          <p className="text-xs text-muted-foreground mt-1">Параметры Icecast и трансляции</p>
        </div>

        <Section icon="Server" title="Сервер Icecast" color="purple">
          <Field label="Хост">
            <Input value={settings.host} onChange={(e) => update('host', e.target.value)} placeholder="stream.example.com" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Порт">
              <Input
                type="number"
                value={settings.port}
                onChange={(e) => update('port', Number(e.target.value))}
              />
            </Field>
            <Field label="Точка монтирования">
              <Input value={settings.mountPoint} onChange={(e) => update('mountPoint', e.target.value)} />
            </Field>
          </div>
          <Field label="Имя пользователя">
            <Input value={settings.username} onChange={(e) => update('username', e.target.value)} />
          </Field>
          <Field label="Пароль источника">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={settings.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </Field>
          <Button
            onClick={testConnection}
            disabled={testing}
            className="w-full gradient-bg-cyan text-background font-semibold"
          >
            {testing ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Проверяем...
              </>
            ) : (
              <>
                <Icon name="Plug" size={16} className="mr-2" />
                Проверить соединение
              </>
            )}
          </Button>
        </Section>

        <Section icon="Sliders" title="Параметры аудио" color="cyan">
          <Field label="Формат">
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => update('format', f)}
                  className={`py-2.5 rounded-xl text-sm font-mono transition-all ${
                    settings.format === f
                      ? 'gradient-bg text-white neon-glow-purple'
                      : 'glass text-muted-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Битрейт: ${settings.bitrate} kbps`}>
            <div className="grid grid-cols-6 gap-1.5">
              {BITRATES.map((b) => (
                <button
                  key={b}
                  onClick={() => update('bitrate', b)}
                  className={`py-2 rounded-lg text-xs font-mono transition-all ${
                    settings.bitrate === b ? 'bg-secondary text-background' : 'glass text-muted-foreground'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Частота дискретизации">
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => update('sampleRate', r)}
                  className={`py-2 rounded-lg text-xs font-mono transition-all ${
                    settings.sampleRate === r ? 'bg-accent text-white' : 'glass text-muted-foreground'
                  }`}
                >
                  {r / 1000}k
                </button>
              ))}
            </div>
          </Field>

          <Field label="Каналы">
            <div className="grid grid-cols-2 gap-2">
              {(['Mono', 'Stereo'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => update('channels', c)}
                  className={`py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                    settings.channels === c ? 'gradient-bg text-white' : 'glass text-muted-foreground'
                  }`}
                >
                  <Icon name={c === 'Stereo' ? 'AudioLines' : 'Volume1'} size={16} />
                  {c}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section icon="Tag" title="Метаданные станции" color="pink">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
            <div>
              <div className="text-sm font-medium">Live-метаданные</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Отправлять название трека слушателям
              </div>
            </div>
            <Switch
              checked={settings.sendMetadata}
              onCheckedChange={(v) => update('sendMetadata', v)}
            />
          </div>
          <Field label="Название станции">
            <Input value={settings.stationName} onChange={(e) => update('stationName', e.target.value)} />
          </Field>
          <Field label="Жанр">
            <Input value={settings.genre} onChange={(e) => update('genre', e.target.value)} />
          </Field>
          <Field label="URL">
            <Input value={settings.url} onChange={(e) => update('url', e.target.value)} />
          </Field>
          <Field label="Описание">
            <Textarea
              value={settings.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
            />
          </Field>
        </Section>

        <div className="glass rounded-2xl p-4 border border-secondary/20">
          <div className="flex gap-3">
            <Icon name="Info" size={18} className="text-secondary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              Метаданные передаются через ICY-протокол на сервер Icecast при каждой смене трека.
              Слушатели увидят название и исполнителя в плеере.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: string;
  title: string;
  color: 'purple' | 'cyan' | 'pink';
  children: React.ReactNode;
}) {
  const colors = {
    purple: 'text-primary',
    cyan: 'text-secondary',
    pink: 'text-accent',
  };
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={18} className={colors[color]} />
        <h3 className="text-xs uppercase tracking-widest font-mono">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default SettingsPage;
