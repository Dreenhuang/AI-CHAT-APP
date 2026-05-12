/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ============ 色彩系统 - Deep Tech Theme v2.0 ============
      colors: {
        // 主品牌色
        primary: {
          DEFAULT: '#0EA5E9',           // 科技亮蓝
          light: '#E0F2FE',             // 极浅蓝
          dark: '#0369A1',              // 深蓝强调
        },

        // 渐变色
        gradient: {
          start: '#0A1929',            // 深空蓝
          end: '#1E3A5F',              // 午夜蓝
        },

        // 消息气泡
        'user-bubble': '#0EA5E9',       // 用户消息-科技蓝
        'ai-bubble': '#FFFFFF',         // AI消息-纯白

        // 背景系
        background: '#F8FAFC',          // 极浅灰蓝背景
        card: '#FFFFFF',                // 纯白卡片

        // 文字层级
        text: {
          primary: '#0F172A',           // 深空黑-主文字
          secondary: '#64748B',         // 科技灰-次要文字
        },

        // 边框与分割线
        border: 'rgba(148, 163, 184, 0.25)', // 金属银半透明

        // 语义色
        error: '#DC2626',               // 错误红
        success: '#059669',             // 成功绿
        warning: '#D97706',             // 警告橙

        // 装饰色系
        'metallic-silver': '#94A3B8',   // 金属银
        'tech-gray': '#64748B',         // 科技灰
      },

      // ============ 字体系统 ============
      fontFamily: {
        // 主字体栈 - Inter优先
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],

        // 等宽字体栈 - Roboto Mono优先
        mono: [
          '"Roboto Mono"',
          '"SF Mono"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'Courier',
          'monospace',
        ],
      },

      // ============ 字号阶梯（基于Typography规范）==========
      fontSize: {
        // 显示文字
        display: ['32px', { fontWeight: '700', lineHeight: '40px', letterSpacing: '-0.5px' }],

        // 大标题
        heading: ['24px', { fontWeight: '700', lineHeight: '32px' }],

        // 导航栏标题
        nav: ['17px', { fontWeight: '700', lineHeight: '22px' }],

        // 页面标题
        title: ['20px', { fontWeight: '600', lineHeight: '28px' }],

        // 正文内容
        body: ['16px', { fontWeight: '400', lineHeight: '24px' }],

        // 次要正文
        'body-secondary': ['15px', { fontWeight: '400', lineHeight: '22px' }],

        // Tab栏文字
        tab: ['10px', { fontWeight: '500', lineHeight: '14px' }],

        // 辅助文字
        caption: ['12px', { fontWeight: '400', lineHeight: '16px' }],

        // 小号文字
        small: ['11px', { fontWeight: '500', lineHeight: '15px' }],

        // 超小文字
        overline: ['10px', { fontWeight: '600', lineHeight: '14px', textTransform: 'uppercase' }],
      },

      // ============ 间距系统（基于4px网格）==========
      spacing: {
        'nav-bar': '44px',
        'tab-bar': '49px',
      },

      // ============ 圆角系统 ==========
      borderRadius: {
        sm: '4px',     // 小圆角-按钮/标签
        md: '8px',     // 中圆角-输入框
        lg: '12px',    // 大圆角-卡片
        xl: '16px',    // 超大圆角-对话框
        full: '9999px', // 完全圆角-头像/徽章
      },

      // ============ 阴影系统 ==========
      boxShadow: {
        // 低层阴影-菜单/按钮
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',

        // 中层阴影-卡片/下拉框
        DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.06)',

        // 高层阴影-模态框/抽屉
        lg: '0 4px 16px rgba(0, 0, 0, 0.12)',

        // 导航栏专用阴影
        nav: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
