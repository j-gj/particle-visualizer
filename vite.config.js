import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js}",
      // Remove babel-plugin-glsl for now - we'll handle GLSL differently
    })
  ],
  // Specify the entry point
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    include: ['three', 'three/webgpu', 'three/tsl'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    port: 3000,
    open: true
  }
})