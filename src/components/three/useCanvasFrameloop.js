import { useEffect, useRef, useState } from 'react';

/**
 * Returns:
 *   - frameloop: 'always' | 'never' | 'demand'
 *   - containerRef: attach to the wrapper around <Canvas>
 *
 * Behavior:
 *   - When the wrapper is out of viewport → 'never' (paused)
 *   - When the tab is hidden               → 'never' (paused)
 *   - When user prefers reduced motion     → 'demand' (renders one frame, then idle)
 *   - Otherwise                            → 'always'
 *
 * Pausing 60fps WebGL when nobody can see it cuts CPU/GPU and laptop fan.
 */
export function useCanvasFrameloop() {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true,
  );
  const [reducedMotion, setReducedMotion] = useState(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  // viewport visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // tab visibility
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // reduced motion preference (live updates)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  let frameloop = 'always';
  if (!inView || !tabVisible) frameloop = 'never';
  else if (reducedMotion) frameloop = 'demand';

  return { frameloop, containerRef, reducedMotion };
}
