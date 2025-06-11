// useLiveSupabaseQuery.ts
import { useEffect, useRef, useState } from 'react';

interface UseLiveSupabaseQueryOptions<T> {
  queryFn: (signal?: AbortSignal) => Promise<T>;
  interval?: number;      // polling interval in ms
  retryInterval?: number; // retry interval on error, default 5000
  timeoutMs?: number;     // per‐request timeout in ms, default 10000
}

export function useLiveSupabaseQuery<T = unknown>({
  queryFn,
  interval = 0,
  retryInterval = 5000,
  timeoutMs = 10000,
}: UseLiveSupabaseQueryOptions<T>) {
  const [data, setData]       = useState<T | null>(null);
  const [error, setError]     = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const abortRef    = useRef<AbortController | null>(null);
  const intervalRef = useRef<number>();
  const retryRef    = useRef<number>();

  // clear any pending interval or retry timers
  const clearTimers = () => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    if (retryRef.current !== undefined) {
      clearTimeout(retryRef.current);
      retryRef.current = undefined;
    }
  };

  // fetch once, with timeout + retry on error
  const fetchData = async () => {
    setLoading(true);

    // abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // enforce per-request timeout
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const result = await queryFn(controller.signal);
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        // schedule retry
        retryRef.current = window.setTimeout(fetchData, retryInterval);
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    // start initial fetch + polling
    fetchData();
    if (interval > 0) {
      intervalRef.current = window.setInterval(fetchData, interval);
    }

    // handle tab visibility changes
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // فقط عند العودة: جلب جديد بدون إيقاف أي شيء
        fetchData();
      }
      // عند الخروج: لا تفعل شيئاً (لا توقف الفيتش ولا التايمر)
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      abortRef.current?.abort();
      clearTimers();
    };
    // run once on mount; caller should wrap queryFn in useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, error, loading, refetch: fetchData };
}
