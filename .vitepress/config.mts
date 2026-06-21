import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/zoo/',
  title: 'ZOO',
  description: '运算器开发技术文档',
  
  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/zoo/logo.jpg?v=4' }]
  ],

  // 主题相关设置
  themeConfig: {


    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],


    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],


    socialLinks: [
      { icon: 'github', link: 'https://github.com/infinity-architects/zoo' }
    ],

    
    footer: {
      message: 'Powered by Vitepress.',
      copyright: 'Copyright © <a href="https://8-infinity.com" target="_blank" rel="noopener noreferrer">Infinity Architects</a>'
    }

  }






})