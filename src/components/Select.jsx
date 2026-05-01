import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Themed dropdown that replaces native <select>.
 *
 * The dropdown PANEL is rendered into a React portal at <body> so it can never
 * be clipped by an ancestor with `overflow:hidden` (e.g. our <Panel> wrapper).
 * Position is computed from the trigger's bounding rect and re-measured on
 * scroll/resize while open. If the dropdown would overflow the bottom of the
 * viewport it flips above the trigger.
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  className = '',
  size = 'md',
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState({ left: 0, top: 0, width: 0, flipUp: false });
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const items = useMemo(
    () => options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options],
  );
  const selected = items.find((o) => o.value === value);

  // (re)measure trigger -> set absolute coords for the portal panel
  const measure = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelHeight = Math.min(items.length * 42 + 8, 264); // approx
    const spaceBelow = window.innerHeight - r.bottom;
    const flipUp = spaceBelow < panelHeight + 16 && r.top > panelHeight + 16;
    setCoords({
      left: r.left + window.scrollX,
      top: (flipUp ? r.top - panelHeight - 8 : r.bottom + 8) + window.scrollY,
      width: r.width,
      flipUp,
    });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    measure();
    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length]);

  // outside click + keyboard
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((i) => (i + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const it = items[highlight];
        if (it) {
          onChange(it.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, items, highlight, onChange]);

  // sync highlight with current value when opening
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, items.findIndex((o) => o.value === value));
    setHighlight(idx);
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector(`[data-idx="${idx}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }, [open, items, value]);

  const sizeCls =
    size === 'sm'
      ? 'px-3 py-1.5 text-sm rounded-lg'
      : 'px-4 py-3 text-base rounded-xl';

  const panel = open ? createPortal(
    <AnimatePresence>
      <motion.ul
        ref={listRef}
        role="listbox"
        initial={{ opacity: 0, y: coords.flipUp ? 6 : -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: coords.flipUp ? 6 : -6, scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          position: 'absolute',
          left: coords.left,
          top: coords.top,
          width: coords.width,
          zIndex: 9999,
        }}
        className="rounded-xl border border-mint-400/25 bg-ink/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(6,18,12,0.6),0_0_30px_rgba(45,212,191,0.15)] overflow-hidden"
      >
        <div className="max-h-64 overflow-y-auto py-1">
          {items.map((o, i) => {
            const active = o.value === value;
            const isHl = i === highlight;
            return (
              <li key={o.value} data-idx={i}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => { onChange(o.value); setOpen(false); triggerRef.current?.focus(); }}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 text-sm transition ${
                    active
                      ? 'bg-mint-400/15 text-mint-200'
                      : isHl
                      ? 'bg-white/10 text-cream'
                      : 'text-cream/80 hover:text-cream'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {active && <Check size={14} className="text-mint-300 shrink-0" />}
                </button>
              </li>
            );
          })}
        </div>
      </motion.ul>
    </AnimatePresence>,
    document.body,
  ) : null;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`w-full ${sizeCls} bg-white/5 border border-white/10 text-cream text-left flex items-center justify-between gap-2 hover:bg-white/[0.07] hover:border-white/20 focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-400/30 transition`}
      >
        <span className={`truncate ${selected ? 'text-cream' : 'text-cream/40'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          className={`text-mint-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {panel}
    </div>
  );
}
