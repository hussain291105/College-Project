import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",   // ✅ ADD THIS LINE (for Electron / file:// loading)
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ Add this section to control build warnings and performance
  build: {
    chunkSizeWarningLimit: 3000, // increase limit from default 500 KB → 3 MB
    sourcemap: false,            // optional: turn off source maps for smaller build
    minify: "esbuild",           // ensure efficient minification
  },
}));
