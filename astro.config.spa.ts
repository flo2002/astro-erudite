import baseConfig from './astro.config'

export default {
  ...(baseConfig as Record<string, unknown>),
  srcDir: './src-spa',
}
