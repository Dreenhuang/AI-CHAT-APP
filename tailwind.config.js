/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      /* ============ 色彩系统扩展 ============ */
      colors: {
        /* 主品牌色系 - Deep Space Blue */
        primary: {
          DEFAULT: '#0A84FF',
          light: '#E8F4FD',
          dark: '#0055D4',
          50: '#E8F4FD',
          100: '#C5E4F9',
          200: '#8DC6F3',
          300: '#55A8ED',
          400: '#2D8AE7',
          500: '#0A84FF',
          600: '#0069D6',
          700: '#0050A8',
          800: '#00387A',
          900: '#00204D',
        },
        
        /* 渐变色 */
        gradient: {
          start: '#0A84FF',
          end: '#5E5CE6',
        },
        
        /* 中性色系 - iOS风格 */
        background: '#F2F2F7',
        surface: '#FFFFFF',
        
        /* 文字颜色 */
        text: {
          primary: '#1C1C1E',
          secondary: '#8E8E93',
          tertiary: '#AEAEB2',
        },
        
        /* 边框颜色 */
        border: {
          DEFAULT: 'rgba(60, 60, 67, 0.1)',
          subtle: 'rgba(60, 60, 67, 0.06)',
        },
        
        /* 语义化颜色 */
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#0A84FF',
        
        /* 金属与科技色 */
        metallic: {
          silver: '#C7C7CC',
          platinum: '#E5E5EA',
        },
        tech: {
          gray: '#636366',
          dark: '#48484A',
        },
        
        /* 用户/AI气泡 */
        'user-bubble': '#0A84FF',
        'ai-bubble': '#FFFFFF',
      },

      /* ============ 字体系统扩展 ============ */
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        /* 显示字体 */
        display: ['34px', { lineHeight: '40px', fontWeight: '800', letterSpacing: '-1px' }],
        
        /* 标题层级 */
        'heading-xl': ['28px', { lineHeight: '34px', fontWeight: '700', letterSpacing: '-0.5px' }],
        'heading-lg': ['24px', { lineHeight: '30px', fontWeight: '700', letterSpacing: '-0.3px' }],
        heading: ['20px', { lineHeight: '26px', fontWeight: '700', letterSpacing: '-0.4px' }],
        'heading-sm': ['17px', { lineHeight: '23px', fontWeight: '600', letterSpacing: '-0.2px' }],
        
        /* 正文字体 */
        body: ['16px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['15px', { lineHeight: '21px', fontWeight: '400' }],
        
        /* 小字 */
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        small: ['11px', { lineHeight: '15px', fontWeight: '500' }],
        tiny: ['10px', { lineHeight: '14px', fontWeight: '500' }],
        
        /* 特殊尺寸 */
        nav: ['17px', { lineHeight: '22px', fontWeight: '700' }],
        tab: ['10px', { lineHeight: '14px', fontWeight: '500' }],
      },

      /* ============ 字重扩展 ============ */
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      /* ============ 间距系统扩展 (4px base) ============ */
      spacing: {
        'nav-bar': '44px',
        'tab-bar': '49px',
        '18': '72px',
        '22': '88px',
        '26': '104px',
        '30': '120px',
      },

      /* ============ 圆角系统扩展 ============ */
      borderRadius: {
        'tech-sm': '6px',
        'tech-md': '10px',
        'tech-lg': '14px',
        'tech-xl': '20px',
      },

      /* ============ 阴影系统扩展 ============ */
      boxShadow: {
        'tech-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'tech-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'tech-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'tech-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(10, 132, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(10, 132, 255, 0.25)',
        'glow-primary': '0 0 24px rgba(10, 132, 255, 0.3)',
      },

      /* ============ 动画与过渡扩展 ============ */
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
        'slower': '700ms',
      },
      
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      /* ============ 背景渐变扩展 ============ */
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #339BFF 0%, #7A6EE8 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1C1C21 0%, #2C2C3E 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(10, 132, 255, 0.03) 0%, transparent 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.58) 100%)',
      },

      /* ============ 模糊效果扩展 ============ */
      backdropBlur: {
        'glass': '20px',
      },

      /* ============ 动画关键帧扩展 ============ */
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(10, 132, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 15px rgba(10, 132, 255, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-left': 'slide-in-left 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
