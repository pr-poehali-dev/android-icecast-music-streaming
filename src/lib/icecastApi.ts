import urls from '../../backend/func2url.json';
import type { IcecastSettings } from './broadcastStore';

type CheckResult = {
  ok: boolean;
  tcp: boolean;
  authOk: boolean;
  mountAvailable: boolean;
  serverInfo: { admin?: string; host?: string; serverId?: string; serverStart?: string } | null;
  error: string | null;
};

type StreamResult = { ok: boolean; bytes?: number; error?: string; response?: string };
type MetaResult = { ok: boolean; song?: string; error?: string };

const headers = { 'Content-Type': 'application/json' };

export async function checkIcecast(s: IcecastSettings): Promise<CheckResult> {
  const r = await fetch(urls['icecast-check'], {
    method: 'POST',
    headers,
    body: JSON.stringify({
      host: s.host,
      port: s.port,
      username: s.username,
      password: s.password,
      mountPoint: s.mountPoint,
    }),
  });
  return r.json();
}

export async function sendMetadata(
  s: IcecastSettings,
  artist: string,
  title: string,
): Promise<MetaResult> {
  const r = await fetch(urls['icecast-metadata'], {
    method: 'POST',
    headers,
    body: JSON.stringify({
      host: s.host,
      port: s.port,
      username: s.username,
      password: s.password,
      mountPoint: s.mountPoint,
      artist,
      title,
    }),
  });
  return r.json();
}

export async function streamChunk(s: IcecastSettings, audioBase64: string): Promise<StreamResult> {
  const r = await fetch(urls['icecast-stream'], {
    method: 'POST',
    headers,
    body: JSON.stringify({
      host: s.host,
      port: s.port,
      username: s.username,
      password: s.password,
      mountPoint: s.mountPoint,
      format: s.format,
      bitrate: s.bitrate,
      sampleRate: s.sampleRate,
      channels: s.channels,
      stationName: s.stationName,
      description: s.description,
      genre: s.genre,
      url: s.url,
      audio: audioBase64,
    }),
  });
  return r.json();
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function pickRecorderMime(format: IcecastSettings['format']): string {
  const candidates = format === 'OGG'
    ? ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus']
    : format === 'AAC'
      ? ['audio/mp4;codecs=mp4a.40.2', 'audio/aac', 'audio/webm;codecs=opus']
      : ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus'];

  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}
