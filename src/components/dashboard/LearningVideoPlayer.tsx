import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { LearningVideo } from '@services/learningVideos';

interface LearningVideoPlayerProps {
  video: LearningVideo;
  /** Fires once per video, the first time playback actually starts. */
  onPlayStart: (video: LearningVideo) => void;
  /** Fires every minute while the video is playing. */
  onMinuteWatched: (minutes: number) => void;
  /** Stretches to the parent box instead of keeping a 16:9 block. */
  fill?: boolean;
}

const withJsApi = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('enablejsapi', '1');
    parsed.searchParams.set('origin', window.location.origin);
    // Our own fullscreen control is used so the notes overlay stays visible.
    parsed.searchParams.set('fs', '0');
    return parsed.toString();
  } catch {
    return url;
  }
};

/**
 * YouTube embed that reports real playback via the IFrame API postMessage
 * protocol, so watch history and daily minutes only count actual viewing.
 */
export const LearningVideoPlayer: React.FC<LearningVideoPlayerProps> = ({
  video,
  onPlayStart,
  onMinuteWatched,
  fill = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onPlayStartRef = useRef(onPlayStart);
  const onMinuteRef = useRef(onMinuteWatched);
  const startedRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);

  onPlayStartRef.current = onPlayStart;
  onMinuteRef.current = onMinuteWatched;

  const src = withJsApi(video.embed_url);

  useEffect(() => {
    setPlaying(false);
    startedRef.current = null;
  }, [video.video_id]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let apiConnected = false;

    const post = (payload: Record<string, unknown>) => {
      iframe.contentWindow?.postMessage(JSON.stringify(payload), '*');
    };

    const handshake = window.setInterval(() => post({ event: 'listening', id: video.video_id }), 600);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;

      let data: any;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data || typeof data !== 'object') return;

      apiConnected = true;

      if (data.event === 'onReady' || data.event === 'initialDelivery') {
        window.clearInterval(handshake);
        post({ event: 'command', func: 'addEventListener', args: ['onStateChange'] });
      }

      const state = typeof data.info === 'number' ? data.info : data?.info?.playerState;
      if (typeof state === 'number') {
        setPlaying(state === 1);
      }
    };

    // Some embeds block the JS API; treat a click into the iframe as a play.
    const handleWindowBlur = () => {
      if (apiConnected) return;
      if (document.activeElement === iframe) setPlaying(true);
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.clearInterval(handshake);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [video.video_id]);

  useEffect(() => {
    if (!playing) return;

    if (startedRef.current !== video.video_id) {
      startedRef.current = video.video_id;
      onPlayStartRef.current(video);
    }

    const timer = window.setInterval(() => onMinuteRef.current(1), 60_000);
    return () => window.clearInterval(timer);
  }, [playing, video]);

  const handleLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening', id: video.video_id }),
      '*'
    );
  }, [video.video_id]);

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: '#0f172a',
        ...(fill ? { width: '100%', height: '100%' } : { aspectRatio: '16 / 9' }),
      }}
    >
      <Box
        component="iframe"
        ref={iframeRef}
        key={video.video_id}
        src={src}
        title={video.title}
        onLoad={handleLoad}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </Box>
  );
};
