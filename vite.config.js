import { defineConfig } from 'vite';
import { resolve } from 'path';
import { sync } from 'glob';
import htmlPurge from 'vite-plugin-html-purgecss';

// Dynamically discover all HTML files for multi-page build
const htmlFiles = sync('**/*.html', {
  cwd: resolve(__dirname),
  ignore: ['node_modules/**', 'dist/**'],
});

const input = {};
htmlFiles.forEach((file) => {
  // Use the file path (without .html) as the entry name
  const name = file.replace(/\.html$/, '').replace(/\\/g, '/');
  input[name] = resolve(__dirname, file);
});

export default defineConfig({
  plugins: [htmlPurge({ safelist: [/is-active/, /animated/, /gsap/, /hide/, /show/, /active/, /visible/, /hidden/, /loaded/, /loading/] })],

  root: resolve(__dirname),
  base: '/qd/',

  esbuild: {
    drop: ['console', 'debugger'],
  },

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    
    rollupOptions: {
      input,
      output: {
        // Hash-based asset file names for immutable caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Minification
    minify: 'esbuild',

    // Asset inlining threshold (4KB)
    assetsInlineLimit: 4096,

    // CSS code splitting
    cssCodeSplit: true,

    // Source maps for debugging (disable in prod if needed)
    sourcemap: false,
  },

  // Dev server
  server: {
    port: 3000,
    open: true,
  },

  // CSS processing
  css: {
    devSourcemap: true,
  },
});
