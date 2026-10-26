import path from "path"
import fs from "fs"
import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

import tailwindcss from "@tailwindcss/vite"

const readWfcVersion = (): string => {
  const pomPath = path.resolve(__dirname, "../pom.xml");
  const pom = fs.readFileSync(pomPath, "utf8");
  const match = pom.match(/<artifactId>commons<\/artifactId>\s*<version>([^<]+)<\/version>/);
  if (!match) throw new Error(`Could not find project <version> in ${pomPath}`);
  return match[1];
};

const WFC_VERSION = readWfcVersion();

// Node CLI rendering WFC reports as Markdown for CI summaries, built with "vite build --mode summary"
const summaryConfig: UserConfig = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssr: { noExternal: true },
  build: {
    ssr: "src/summary/main.ts",
    outDir: '../target/classes/webreport',
    emptyOutDir: false,
    target: "node18",
    rollupOptions: {
      output: {
        format: "cjs",
        entryFileNames: "wfc-summary.cjs",
        inlineDynamicImports: true,
      },
    },
  },
};

// https://vite.dev/config/
const appConfig = {
  plugins: [react(), tailwindcss()],
  define: {
    __WFC_VERSION__: JSON.stringify(WFC_VERSION),
  },
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
        }
      }
    }
  },

} as UserConfig

export default defineConfig(({ mode }) => (mode === "summary" ? summaryConfig : appConfig))
