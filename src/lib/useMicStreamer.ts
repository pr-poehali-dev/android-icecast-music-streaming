import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToBase64, pickRecorderMime, streamChunk } from './icecastApi';
import type { IcecastSettings } from './broadcastStore';

type Status = 'idle' | 'starting' | 'live' | 'error';

const CHUNK_MS = 4000;

export function useMicStreamer(settings: IcecastSettings) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [bytesSent, setBytesSent] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const liveRef = useRef(false);

  const stop = useCallback(() => {
    liveRef.current = false;
    try {
      recorderRef.current?.stop();
    } catch (e) {
      void e;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (liveRef.current) return;
    setError(null);
    setStatus('starting');
    setBytesSent(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: settings.channels === 'Stereo' ? 2 : 1,
          sampleRate: settings.sampleRate,
        },
      });
      streamRef.current = stream;

      const mime = pickRecorderMime(settings.format);
      if (!mime) throw new Error('Браузер не поддерживает запись аудио');

      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        audioBitsPerSecond: settings.bitrate * 1000,
      });
      recorderRef.current = recorder;
      liveRef.current = true;

      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0) return;
        const blob = event.data;
        queueRef.current = queueRef.current.then(async () => {
          if (!liveRef.current) return;
          try {
            const b64 = await blobToBase64(blob);
            const res = await streamChunk(settings, b64);
            if (res.ok) {
              setBytesSent((b) => b + (res.bytes || blob.size));
            } else if (res.error) {
              setError(res.error);
            }
          } catch (e) {
            setError(String(e));
          }
        });
      };

      recorder.onerror = (e: Event) => {
        setError(String((e as ErrorEvent).message || 'Recorder error'));
        stop();
        setStatus('error');
      };

      recorder.start(CHUNK_MS);
      setStatus('live');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
  }, [settings, stop]);

  useEffect(() => {
    return () => {
      liveRef.current = false;
      try {
        recorderRef.current?.stop();
      } catch (e) {
        void e;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { status, error, bytesSent, start, stop };
}
