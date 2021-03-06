import { dirname, join } from 'path'
import querystring from 'querystring'
import { detectLanguage } from './lib/content/detectLanguage'

const SITE_URL = 'https://romaricpascal.is'
const SITE_TITLE = 'Romaric Pascal'
const FEED_DESCRIPTIONS = {
  en: 'Thoughts about front-end development (mostly)',
  fr: "Pensées sur l'intégration web (en gros)",
}

const LOCALES = {
  locales: [
    {
      code: 'en',
      iso: 'en',
      name: 'English',
    },
    { code: 'fr', iso: 'fr', name: 'Français' },
  ],
  defaultLocale: 'en',
}

const EXTRA_JS = false // { main: ['./assets/main.js'] };

export default {
  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    titleTemplate: (titleChunk) => {
      if (titleChunk) {
        return `${titleChunk} | Romaric Pascal`
      }
      return 'Romaric Pascal'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },

      // Social metadata
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: SITE_TITLE, hid: 'ogTitle' },
      { property: 'og:description', content: '', hid: 'ogDescription' },
      { property: 'og:image', content: `${SITE_URL}/media/meta.png` },
      { property: 'twitter:card', content: 'summary' },
      { property: 'twitter:creator', content: 'romaricpascal' },

      // Favicon stuff
      { name: 'msapplication-TileColor', content: '#111111' },
      {
        name: 'msapplication-config',
        content: '/media/favicons/browserconfig.xml',
      },
      { name: 'theme-color', content: '#ffffff' },
    ],
    link: [
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/media/favicons/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/media/favicons/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/media/favicons/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/media/favicons/site.webmanifest' },
      {
        rel: 'mask-icon',
        href: '/media/favicons/safari-pinned-tab.svg',
        color: '#111111',
      },
      { rel: 'shortcut icon', href: '/media/favicons/favicon.ico' },
    ],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: ['~/assets/style.scss'],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: ['~/plugins/formatDate.js'],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    process.env.NODE_ENV === 'production' ? '@nuxtjs/eslint-module' : null,
    // https://go.nuxtjs.dev/stylelint
    process.env.NODE_ENV === 'production' ? '@nuxtjs/stylelint-module' : null,
  ].filter(Boolean),

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/content
    '@nuxt/content',
    // Paginate before i18n so routes get internationalised as necessary
    ['~/modules/paginate-routes', { paths: ['/posts/'] }],
    'nuxt-i18n',
    '@nuxtjs/feed',
    '~/modules/no-nuxt-client',
  ],

  // Content module configuration (https://go.nuxtjs.dev/config-content)
  content: {
    liveEdit: false,
    markdown: {
      remarkPlugins(plugins) {
        return ['remark-hreflang', ...plugins]
      },
      rehypePlugins(plugins) {
        return [
          ...plugins,
          './rehype/well-known-urls',
          './rehype/code-blocks',
          './rehype/format-code',
          'rehype-hreflang',
          ['rehype-highlight', { ignoreMissing: true }],
        ]
      },
      highlighter(rawCode, lang, _, { h, node, u }) {
        // Simply returning `rawCode` would get any HTML in there parsed
        // Instead, we need to create the HAST structure
        // and pass the code as a text node
        return h(node, 'pre', [
          h(node, 'code', { className: [`language-${lang}`] }, [
            u('text', rawCode),
          ]),
        ])
      },
    },
  },

  // Remove nuxt client
  noNuxtClient: {
    removeNuxt: {
      ignore: (node) =>
        EXTRA_JS && /(runtime|main).js/.test(node.properties.src || ''),
    },
  },

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    extractCSS: true,
    extend(config, { isClient, isDev }) {
      if (isClient && EXTRA_JS) {
        config.entry = Object.assign({}, config.entry || {}, EXTRA_JS)

        if (isDev) {
          // Thanks Nuxt default config
          // https://github.com/nuxt/nuxt.js/blob/dev/packages/webpack/src/config/client.js
          const {
            options: { router },
          } = this.buildContext

          const hotMiddlewareClientOptions = {
            reload: true,
            timeout: 30000,
            path: `${router.base}/__webpack_hmr/${config.name}`.replace(
              /\/\//g,
              '/'
            ),
            name: this.name,
          }

          const hotMiddlewareClientOptionsStr = querystring.stringify(
            hotMiddlewareClientOptions
          )

          config.entry.main.unshift(
            'eventsource-polyfill',
            `webpack-hot-middleware/client?${hotMiddlewareClientOptionsStr}`
          )
        }
      }
    },
  },

  hooks: {
    'content:file:beforeInsert'(document) {
      const languageCodes = LOCALES.locales.map((l) => l.code)
      const regexp = new RegExp(`--(${languageCodes.join('|')})$`)

      const languageInfo = detectLanguage(document.path, {
        languages: languageCodes,
      })
      Object.assign(document, languageInfo)
      document.slug = document.slug.replace(regexp, '')

      document.route = join(dirname(document.path), document.slug)
        .replace(/^\//, '')
        .replace(/index$/, '__INDEX__')
    },
  },

  i18n: {
    ...LOCALES,
    vueI18nLoader: true,
    vueI18n: {
      fallbackLocale: 'en',
      messages: {
        en: {
          siteDescription: 'Thoughts about front-end development (mostly)',
        },
        fr: {
          siteDescription: "Pensées sur l'intégration web (en gros)",
        },
      },
      dateTimeFormats: {
        'en-gb': {
          // Require 'en-gb' here so that date is in the right order
          short: {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          },
        },
        fr: {
          short: {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          },
        },
      },
    },
    seo: true,
    vuex: {
      syncLocale: true,
      setRouteParams: true,
    },
  },

  feed() {
    const baseUrl = SITE_URL
    const feedFormats = {
      rss: { type: 'rss2', file: 'feed.xml' },
      json: { type: 'json1', file: 'feed.json' },
    }
    const { $content } = require('@nuxt/content')

    const feeds = LOCALES.locales.map(createFeeds).flat()
    return feeds

    function createFeeds(locale) {
      return Object.values(feedFormats).map(({ file, type }) => ({
        path: i18nRoute(file, { locale: locale.code }),
        type,
        create: createFeedArticles(locale.code),
      }))
    }

    function createFeedArticles(localeCode) {
      return async function create(feed) {
        feed.options = {
          title: 'Romaric Pascal',
          author: 'Romaric Pascal <hello@romaricpascal.is>',
          description: FEED_DESCRIPTIONS[localeCode],
          link: baseUrl,
          language: localeCode,
        }
        const articles = await $content('posts')
          .where({
            language: localeCode,
          })
          .sortBy('date', 'desc')
          .limit(20)
          .fetch()

        articles.forEach((article) => {
          const url = `${baseUrl}/${i18nRoute(article.route, {
            locale: localeCode,
          })}`

          feed.addItem({
            title: article.title,
            id: url,
            link: url,
            date: new Date(article.date),
          })
        })
      }
    }
  },

  router: {
    trailingSlash: true,
    extendRoutes(routes) {
      // Duplicate the catch all route to create a root route
      // This will allow the i18n plugin to correctly
      // create the internationalised route paths
      const root = routes.find((r) => r.name === '*')
      routes.splice(routes.length - 1, 0, {
        ...root,
        name: '/',
        path: '/',
        chunkName: 'pages/index',
      })
    },
  },
}

function i18nRoute(path, { locale }) {
  if (locale !== LOCALES.defaultLocale) {
    return `${locale}/${path}`
  }

  return path
}
