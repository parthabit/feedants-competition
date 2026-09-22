import { useEffect, useRef, useState } from 'react';

/**
 * Ticks once a second toward `targetAt`, measured against the SERVER clock (`getNow`).
 * Calls `onExpire` exactly once per target when it reaches zero so the screen can
 * re-fetch and move to the next lifecycle state (e.g. registration closed -> button disabled).
 */
export function useCountdown(targetAt: string | null, getNow: () => number, onExpire?: () => void): number {
  const getNowRef = useRef(getNow);
  const onExpireRef = useRef(onExpire);
  getNowRef.current = getNow;
  onExpireRef.current = onExpire;

  const [remaining, setRemaining] = useState<number>(() => (targetAt ? Math.max(0, Date.parse(targetAt) - getNow()) : 0));

  useEffect(() => {
    if (!targetAt) {
      setRemaining(0);
      return;
    }
    const target = Date.parse(targetAt);
    let fired = false;
    const tick = () => {
      const left = target - getNowRef.current();
      setRemaining(Math.max(0, left));
      if (left <= 0 && !fired) {
        fired = true;
        // small delay so the server is definitely past the boundary when we re-fetch
        setTimeout(() => onExpireRef.current?.(), 700);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetAt]);

  return remaining;
}
