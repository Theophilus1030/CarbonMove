import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      external: ['buffer'],
    },
  },
  server: {
    open: true,
  },
  plugins: [
    react(),
    nodePolyfills({
      // 强制包含 buffer 和 process，这俩是 Web3 项目的命根子
      include: ['buffer', 'process', 'util', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend"),
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    global: 'window',
  },
});
