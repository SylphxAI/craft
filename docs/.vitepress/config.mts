import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Craft - Fast Immutable State",
  description: "The fastest immutable state library for TypeScript. 1.4-35x faster than immer, 4.6 KB gzipped, zero dependencies, 100% type-safe.",
  base: '/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Craft - Fast Immutable State' }],
    ['meta', { property: 'og:description', content: 'The fastest immutable state library for TypeScript' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Comparison', link: '/comparison' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Core Concepts', link: '/guide/usage' },
            { text: 'Advanced Features', link: '/guide/advanced' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Type Safety', link: '/guide/type-safety' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Core Functions', link: '/api/core' },
            { text: 'Composition', link: '/api/composition' },
            { text: 'Introspection', link: '/api/introspection' },
            { text: 'Debugging', link: '/api/debugging' },
            { text: 'Configuration', link: '/api/configuration' },
            { text: 'Utilities', link: '/api/utilities' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'Arrays', link: '/examples/arrays' },
            { text: 'Map & Set', link: '/examples/map-set' },
            { text: 'JSON Patches', link: '/examples/patches' },
            { text: 'Async Operations', link: '/examples/async' },
            { text: 'Composition', link: '/examples/composition' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/SylphxAI/craft' },
      { icon: 'twitter', link: 'https://x.com/SylphxAI' },
    ],

    editLink: {
      pattern: 'https://github.com/SylphxAI/craft/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Sylphx Limited'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    }
  }
})
