/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 集成 Apple Design Token 系统
      colors: {
        // 主色调 - Apple Blue
        primary: {
          DEFAULT: '#0071e3',
          hover: '#0077ed',
          light: '#2997ff',
          dark: '#0055d4',
        },
        // 次要色 - 紫色
        secondary: {
          DEFAULT: '#5e5ce6',
          hover: '#6e6ce8',
          light: '#807ef0',
          dark: '#4a48c7',
        },
        // 功能色
        success: {
          DEFAULT: '#34c759',
          light: '#30d158',
          dark: '#248a3d',
        },
        warning: {
          DEFAULT: '#ff9f0a',
          light: '#ffcc00',
          dark: '#c68400',
        },
        danger: {
          DEFAULT: '#ff3b30',
          light: '#ff453a',
          dark: '#d70015',
        },
        // 背景色系 - Apple灰度系统
        bg: {
          primary: '#ffffff',
          secondary: '#f5f5f7',
          tertiary: '#e8e8ed',
          quaternary: '#d2d2d7',
        },
        // 文字色系
        text: {
          primary: '#1d1d1f',
          secondary: '#6e6e73',
          tertiary: '#86868b',
          quaternary: '#aeaeb2',
        },
        // 边框色
        border: {
          DEFAULT: '#d2d2d7',
          light: '#e5e5ea',
          dark: '#c7c7cc',
        },
      },
      // 字体系统 - Apple SF Pro
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      // 字体大小 - 基于4px基准的Apple字体层级
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.01em' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
        base: ['16px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        lg: ['18px', { lineHeight: '24px', letterSpacing: '-0.02em' }],
        xl: ['20px', { lineHeight: '26px', letterSpacing: '-0.02em' }],
        '2xl': ['24px', { lineHeight: '30px', letterSpacing: '-0.02em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.03em' }],
        '4xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.03em' }],
      },
      // 间距系统 - 4px基准
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
      // 圆角系统 - Apple风格圆角
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '10px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
        '2xl': '24px',
        'full': '9999px',
      },
      // 阴影系统 - Apple风格阴影（柔和、多层次）
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'DEFAULT': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'xl': '0 12px 36px rgba(0, 0, 0, 0.16)',
        'inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
        // Apple特有阴影效果
        'apple': '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.06)',
      },
      // 过渡动画
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'apple-in': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'apple-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // 断点 - 响应式设计
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Z-index 层级管理
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
    },
  },
  plugins: [],
}
