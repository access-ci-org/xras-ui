import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    "process.env": {},
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    cssCodeSplit: true,
    lib: {
      entry: [
        resolve(__dirname, "src/main.jsx"),
        resolve(__dirname, "src/bootstrap/access.scss"),
        resolve(__dirname, "src/tailwind.css"),
      ],
      name: "XrasUi",
      fileName: "xras-ui",
    },
    rollupOptions: {
      output: {
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === "main.css") return "xras-ui.css";
          if (chunkInfo.name === "access.css") return "access.css";
          if (chunkInfo.name === "tailwind.css") return "tailwind.css";
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
}));
