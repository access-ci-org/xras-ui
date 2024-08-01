import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': {}
  },
  build: {
    cssCodeSplit: true,
    lib: {
      entry: [
        resolve(__dirname, "src/main.jsx"),
        resolve(__dirname, "src/bootstrap/bootstrap-namespaced.scss"),
        resolve(__dirname, "src/bootstrap/access.scss"),
      ],
      name: "XrasUi",
      fileName: "xras-ui",
    },
    rollupOptions: {
      output: {
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === "main.css") return "xras-ui.css";
          if (chunkInfo.name === "bootstrap-namespaced.css")
            return "bootstrap.css";
          if (chunkInfo.name === "access.css") return "access.css";
        },
      },
    },
  },
  plugins: [react()],
});
