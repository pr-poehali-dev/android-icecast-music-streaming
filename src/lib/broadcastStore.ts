import { useEffect, useState } from 'react';

export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  cover: string;
  genre: string;
};

export type IcecastSettings = {
  host: string;
  port: number;
  mountPoint: string;
  username: string;
  password: string;
  bitrate: number;
  format: 'MP3' | 'OGG' | 'AAC';
  sampleRate: number;
  channels: 'Mono' | 'Stereo';
  stationName: string;
  description: string;
  genre: string;
  url: string;
  sendMetadata: boolean;
};

export type BroadcastState = {
  isLive: boolean;
  currentTrackId: string | null;
  listeners: number;
  uptime: number;
  volume: number;
};

const DEFAULT_SETTINGS: IcecastSettings = {
  host: 'stream.example.com',
  port: 8000,
  mountPoint: '/live.mp3',
  username: 'source',
  password: '',
  bitrate: 192,
  format: 'MP3',
  sampleRate: 44100,
  channels: 'Stereo',
  stationName: 'AIRWAVE FM',
  description: 'Авторская музыкальная трансляция',
  genre: 'Electronic',
  url: 'https://airwave.fm',
  sendMetadata: true,
};

const DEFAULT_TRACKS: Track[] = [
  { id: '1', title: 'Neon Pulse', artist: 'Aurora Beats', duration: 218, cover: '🎵', genre: 'Synthwave' },
  { id: '2', title: 'Midnight Drive', artist: 'Chrome Hearts', duration: 245, cover: '🌙', genre: 'Electronic' },
  { id: '3', title: 'Velvet Sky', artist: 'Lumen', duration: 192, cover: '✨', genre: 'Ambient' },
  { id: '4', title: 'Electric Dreams', artist: 'Voltage', duration: 267, cover: '⚡', genre: 'Synthwave' },
  { id: '5', title: 'Pink Horizon', artist: 'Sunset Run', duration: 201, cover: '🌅', genre: 'Chillwave' },
  { id: '6', title: 'Cyber Rain', artist: 'Glitch Lab', duration: 234, cover: '🌧️', genre: 'IDM' },
  { id: '7', title: 'Lost in Tokyo', artist: 'Neon Tokyo', duration: 256, cover: '🏙️', genre: 'City Pop' },
  { id: '8', title: 'Crystal Wave', artist: 'Prism', duration: 189, cover: '💎', genre: 'House' },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    void e;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<IcecastSettings>(() => load('icecast.settings', DEFAULT_SETTINGS));
  useEffect(() => save('icecast.settings', settings), [settings]);
  return [settings, setSettings] as const;
}

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>(() => load('icecast.tracks', DEFAULT_TRACKS));
  useEffect(() => save('icecast.tracks', tracks), [tracks]);
  return [tracks, setTracks] as const;
}

export function useQueue() {
  const [queue, setQueue] = useState<string[]>(() => load('icecast.queue', ['1', '2', '3']));
  useEffect(() => save('icecast.queue', queue), [queue]);
  return [queue, setQueue] as const;
}

export function useBroadcast() {
  const [state, setState] = useState<BroadcastState>(() => ({
    isLive: false,
    currentTrackId: null,
    listeners: 0,
    uptime: 0,
    volume: 80,
  }));

  useEffect(() => {
    if (!state.isLive) return;
    const id = window.setInterval(() => {
      setState((s) => ({
        ...s,
        uptime: s.uptime + 1,
        listeners: Math.max(0, s.listeners + (Math.random() > 0.6 ? 1 : Math.random() > 0.7 ? -1 : 0)),
      }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.isLive]);

  return [state, setState] as const;
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function formatUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}