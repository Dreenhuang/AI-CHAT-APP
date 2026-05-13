import { defineConfig, Plugin } from 'vite'
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

// Packages that ship JSX in .js files (need special handling for Rollup)
const jsxInJsPackages = [
  '@expo/vector-icons',
  'expo-linear-gradient',
  'expo-notifications',
  '@react-navigation',
  'react-native-safe-area-context',
];

export default defineConfig({
  plugins: [
    react({
      // Tell the react plugin to also process .js files from these packages
      include: /\.(jsx?|tsx?|mjs)$/,
    }),
  ],

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
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      ...reactNativeWebAliases,
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.json'],
  },

  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
      },
    },
    include: [
      'react',
      'react-dom',
      'react-native-web',
      'zustand',
      '@react-navigation/native',
      '@react-navigation/native-stack',
      '@react-navigation/bottom-tabs',
      '@react-navigation/stack',
      'react-native-safe-area-context',
      '@expo/vector-icons',
    ],
  },
})
