import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  // Pre-bundle heavy deps in dev so the first cold load isn't slow while
  // Vite figures out three.js' module graph.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },
  build: {
    chunkSizeWarningLimit: 900,
    // modulepreload polyfill emits <link rel="modulepreload"> for chunks the
    // entry needs, kicking off parallel fetches earlier.
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
