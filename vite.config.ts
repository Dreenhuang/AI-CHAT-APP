import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const reactNativeWebAliases = {
  'react-native': 'react-native-web',
  'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'node_modules/react-native-web/dist/modules/forwardedProps/index.js'),
  'react-native/Libraries/Renderer/shims/ReactNative': 'react-native-web/dist/exports/AppRegistry',
  'react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance': path.resolve(__dirname, 'node_modules/react-native-web/dist/exports/AppRegistry'),
  'react-native/Libraries/Renderer/shims/ReactFabric': path.resolve(__dirname, 'node_modules/react-native-web/dist/exports/AppRegistry'),
  'react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry': path.resolve(__dirname, 'node_modules/react-native-web/dist/exports/View'),
  'react-native/Libraries/Pressability/PressabilityDebug': path.resolve(__dirname, 'node_modules/react-native-web/dist/exports/View'),
};

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
      ...reactNativeWebAliases,
    },
  },

  esbuild: {
    loader: 'jsx',
    include: /.*/,
    exclude: [],
  },
  
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
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
