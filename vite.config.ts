import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 8081,
    host: true,
    open: true,
    
    proxy: {
      '/api': {
        target: 'http://localhost:9461',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:9461',
        ws: true,
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  esbuild: {
    jsx: 'automatic',
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@expo/vector-icons',
      '@react-navigation/native',
      '@react-navigation/native-stack',
      '@react-navigation/bottom-tabs',
    ],
  },
})
