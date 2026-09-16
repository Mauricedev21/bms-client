import { useEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';

interface RateLimitErrorPayload {
  error?: { code?: string; details?: { retryAfter?: number } };
}

/**
 * Tracks the 30-second cooldown returned by the backend login rate limiter
 * (429 + code RATE_LIMITED + details.retryAfter). Returns true from `apply`
 * when a cooldown started so callers can show the countdown message.
 */
export function useRateLimitCooldown() {
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const total = useRef(0);

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setLocked(false);
    setSeconds(0);
  };

  const apply = (err: unknown): boolean => {
    stop();
    const e = err as AxiosError<RateLimitErrorPayload> | null | undefined;
    const status = (e as { response?: { status?: number } } | undefined)?.response?.status;
    const data = (e as { response?: { data?: RateLimitErrorPayload } } | undefined)?.response?.data;
    if (status !== 429 || data?.error?.code !== 'RATE_LIMITED') return false;

    total.current = Math.max(1, data.error.details?.retryAfter ?? 30);
    startedAt.current = Date.now();
    setSeconds(total.current);
    setLocked(true);
    timer.current = setInterval(() => {
      const left = Math.max(0, Math.ceil(total.current - (Date.now() - startedAt.current) / 1000));
      setSeconds(left);
      if (left <= 0) stop();
    }, 250);
    return true;
  };

  useEffect(() => stop, []);

  return { locked, seconds, apply, stop };
}