import path from "path"
import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src-e2e/setup.ts'],
    include: ['./src-e2e/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: '../target/classes/webreport',
    rollupOptions: {
      output: {
        entryFileNames: `assets/report.js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: (assetInfo: { name: string }) => {
            const extType = assetInfo.name.split('.').pop();
            if (extType === 'css') {
                return `assets/report.css`;
            }
            if (extType === 'svg') {
                return `assets/[name].svg`;
            }
            return `assets/[name].[ext]`;
        },
      }
    }
  },

} as UserConfig)
