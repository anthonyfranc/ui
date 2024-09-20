import { defu } from 'defu'
import { createResolver, defineNuxtModule, addComponentsDir, addImportsDir, addVitePlugin, addPlugin, installModule, extendPages, addServerHandler, hasNuxtModule } from '@nuxt/kit'
import { addTemplates } from './templates'
import icons from './theme/icons'
import { addCustomTab, extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import sirv from 'sirv'
import type { ClientFunctions, ServerFunctions } from './devtools/rpc'
import * as theme from './theme'

export type * from './runtime/types'

export interface ModuleOptions {
  /**
   * Prefix for components
   * @defaultValue U
   */
  prefix?: string

  /**
   * Colors to generate classes for (based on TailwindCSS colors)
   * @defaultValue ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
   */
  colors?: string[]

  /**
   * Enable or disable `@nuxt/fonts` module
   * @defaultValue true
   */
  fonts?: boolean

  theme?: {
    /**
     * Enable or disable transitions on components
     * @defaultValue true
     */
    transitions?: boolean
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'ui',
    configKey: 'ui',
    compatibility: {
      nuxt: '>=3.13.1'
    }
  },
  defaults: {
    prefix: 'U',
    colors: undefined,
    fonts: true,
    theme: {
      transitions: true
    }
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    options.colors = options.colors?.length ? [...new Set(['primary', 'error', ...options.colors])] : ['primary', 'error', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']

    nuxt.options.ui = options

    nuxt.options.alias['#ui'] = resolve('./runtime')

    nuxt.options.appConfig.ui = defu(nuxt.options.appConfig.ui || {}, {
      colors: {
        primary: 'green',
        error: 'red',
        gray: 'cool'
      },
      icons
    })

    // Isolate root node from portaled components
    nuxt.options.app.rootAttrs = nuxt.options.app.rootAttrs || {}
    nuxt.options.app.rootAttrs.class = [nuxt.options.app.rootAttrs.class, 'isolate'].filter(Boolean).join(' ')

    if (nuxt.options.builder === '@nuxt/vite-builder') {
      const plugin = await import('@tailwindcss/vite').then(r => r.default)
      addVitePlugin(plugin())
    } else {
      nuxt.options.postcss.plugins['@tailwindcss/postcss'] = {}
    }

    if (options.fonts) {
      if (!hasNuxtModule('@nuxt/fonts')) {
        await installModule('@nuxt/fonts', { experimental: { processCSSVariables: true } })
      } else {
        nuxt.options.fonts = defu(nuxt.options.fonts, { experimental: { processCSSVariables: true } })
      }
    }

    if (!hasNuxtModule('@nuxt/icon')) {
      await installModule('@nuxt/icon', { cssLayer: 'components' })
    } else {
      nuxt.options.icon = defu(nuxt.options.icon, { cssLayer: 'components' })
    }

    // if (!hasNuxtModule('@nuxtjs/color-mode')) {
    //   await installModule('@nuxtjs/color-mode', { classSuffix: '' })
    // } else {
    //   nuxt.options.colorMode = defu(nuxt.options.colorMode, { classSuffix: '' })
    // }

    addPlugin({
      src: resolve('./runtime/plugins/colors')
    })
    addPlugin({
      src: resolve('./runtime/plugins/modal')
    })
    addPlugin({
      src: resolve('./runtime/plugins/slideover')
    })

    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: options.prefix,
      pathPrefix: false
    })

    addImportsDir(resolve('./runtime/composables'))

    addTemplates(options, nuxt)

    if (nuxt.options.dev && nuxt.options.devtools.enabled) {
      nuxt.options.nitro.routeRules['_ui/**'] = { ssr: false }

      nuxt.hook('vite:serverCreated', async (server) => {
        server.middlewares.use('/_ui/devtools', sirv(resolve('../devtools/dist'), {
          single: true,
          dev: true
        }))
      })

      nuxt.hook('app:resolve', (app) => {
        app.rootComponent = resolve('./devtools/nuxt-root.vue')
      })

      addServerHandler({
        route: '/_ui/config',
        handler: resolve('./devtools/server/config.post.ts'),
        method: 'POST'
      })

      extendPages((pages) => {
        pages.unshift({
          name: 'ui-devtools',
          path: '/_ui/components/:component'
        })
      })

      onDevToolsInitialized(async () => {
        const _rpc = extendServerRpc<ClientFunctions, ServerFunctions>('nuxt/ui/devtools', {
          getComponents() {
            return Object.keys(theme).map(slug => ({ slug }))
          }
        })
      })

      addCustomTab({
        name: 'nuxt-ui',
        title: 'Nuxt UI',
        icon: 'bx:paint',
        view: {
          type: 'iframe',
          src: '/_ui/devtools'
        }
      })
    }
  }
})
