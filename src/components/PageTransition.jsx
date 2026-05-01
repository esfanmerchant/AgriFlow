/**
 * Previously wrapped each page in a fade-in animation. Removed because the
 * fade overlapped with React's mount work, producing a perceptible blank
 * frame on route changes. Routes now swap instantly; in-page content still
 * gets its own scroll-triggered Reveal animations once mounted.
 */
export default function PageTransition({ children }) {
  return <>{children}</>;
}
