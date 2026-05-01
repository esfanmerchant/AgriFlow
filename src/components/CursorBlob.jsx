import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Soft custom cursor: small glowing dot + lerping outer ring.
 * Hidden on touch / small screens via CSS in index.css (uses .cursor-on
 * class on body which is added below).
 *
 * Implementation notes:
 *  - Bound after idle time so first paint isn't blocked.
 *  - Hover-grow uses document-level event delegation (mouseover / mouseout)
 *    so it works on elements added dynamically to the DOM AFTER mount —
 *    e.g. Select dropdowns rendered via React Portal, cart drawer items,
 *    modals, etc. The previous implementation queried the DOM once and
 *    missed everything that came later.
 */
export default function CursorBlob() {
  const dot = useRef(null);
  const ring = useRef(null);
  const hoverDepth = useRef(0); // counts nested interactive enters/leaves

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined;

    let dx = 0, dy = 0, rx = 0, ry = 0;
    let raf;

    const onMove = (e) => { dx = e.clientX; dy = e.clientY; };
    const tick = () => {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      if (dot.current)  dot.current.style.transform  = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(tick);
    };

    const enter = () => {
      if (!ring.current) return;
      ring.current.style.width = '64px';
      ring.current.style.height = '64px';
      ring.current.style.background = 'rgba(94,234,212,0.10)';
      ring.current.style.borderColor = 'rgba(94,234,212,0.85)';
    };
    const leave = () => {
      if (!ring.current) return;
      ring.current.style.width = '38px';
      ring.current.style.height = '38px';
      ring.current.style.background = 'transparent';
      ring.current.style.borderColor = 'rgba(94,234,212,0.65)';
    };

    const isInteractive = (target) =>
      target instanceof Element &&
      target.closest('a, button, [role="button"], [role="option"], [data-magnetic], input, textarea, select, [tabindex]:not([tabindex="-1"])');

    // mouseover/mouseout bubble (unlike mouseenter/leave) so a single
    // document listener catches every element including portal-rendered ones.
    const onOver = (e) => {
      const fromInteractive = isInteractive(e.relatedTarget);
      const toInteractive   = isInteractive(e.target);
      if (toInteractive && !fromInteractive) {
        hoverDepth.current = 1;
        enter();
      }
    };
    const onOut = (e) => {
      const fromInteractive = isInteractive(e.target);
      const toInteractive   = isInteractive(e.relatedTarget);
      if (fromInteractive && !toInteractive) {
        hoverDepth.current = 0;
        leave();
      }
    };

    const start = () => {
      document.body.classList.add('cursor-on');
      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseover', onOver, { passive: true });
      document.addEventListener('mouseout',  onOut,  { passive: true });
      raf = requestAnimationFrame(tick);
    };

    let idleHandle;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    idleHandle = idle(start, { timeout: 800 });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
      window.cancelIdleCallback?.(idleHandle);
      document.body.classList.remove('cursor-on');
    };
  }, []);

  // Portal to body so the cursor is a direct child of <body>, never trapped
  // inside any stacking context (modal backdrops, transformed parents, etc.)
  // and always able to sit above portaled dropdowns/toasts.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      <div ref={dot}  className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>,
    document.body,
  );
}
