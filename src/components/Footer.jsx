import { Github, Mail, Twitter } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="relative mt-12 sm:mt-20 border-t border-white/10 bg-blobs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <div className="font-display font-extrabold text-cream text-lg">
                Agri<span className="text-gradient-mint">Flow</span>
              </div>
              <div className="text-xs text-cream/50">Agri-Supply Management System</div>
            </div>
          </div>
          <p className="text-sm text-cream/60 mt-4 max-w-md">
            A 3D, animated marketplace connecting farmers and suppliers — built on a BCNF-normalised database with ACID-safe transactions.
          </p>
          <div className="flex gap-3 mt-4">
            {[Github, Twitter, Mail].map((I, i) => (
              <a key={i} href="#" className="w-10 h-10 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-glow-mint transition text-cream/70 hover:text-mint-300">
                <I size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-mint-300 font-bold mb-3">Product</div>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><a href="#features" className="hover:text-mint-300">Features</a></li>
            <li><a href="#how"      className="hover:text-mint-300">How it works</a></li>
            <li><a href="#stack"    className="hover:text-mint-300">Tech</a></li>
            <li><a href="#stories"  className="hover:text-mint-300">Stories</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-mint-300 font-bold mb-3">Get started</div>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><a href="/signup" className="hover:text-mint-300">Sign up as Farmer</a></li>
            <li><a href="/signup" className="hover:text-mint-300">Sign up as Supplier</a></li>
            <li><a href="/login"  className="hover:text-mint-300">Sign in</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-cream/50">
        © 2026 AgriFlow · Built with care for farmers and suppliers.
      </div>
    </footer>
  );
}
