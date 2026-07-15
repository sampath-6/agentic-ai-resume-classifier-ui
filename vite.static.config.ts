import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds the FULL app (app.html + src/static-main.tsx) into ONE self-contained HTML
// file with all JS/CSS inlined. The output (static-site/index.html) opens offline by
// double-click — no dev server, no build step for the viewer, git-friendly.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'static-site',
    emptyOutDir: true,
    rollupOptions: {
      input: 'app.html',
    },
  },
})
