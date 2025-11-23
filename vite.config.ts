import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  build: {
    outDir: "dist",
    // 🟢 修复核心：删除了 rollupOptions.external
    commonjsOptions: {
      transformMixedEsModules: true, // 建议开启，有助于兼容 Web3 的老包
    },
  },
  server: {
    open: true,
  },
  plugins: [
    react(),
    nodePolyfills({
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
      // 这些别名保留着没问题，双重保险
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
    // 这里的 global 定义也保留
    global: 'window',
  },
});