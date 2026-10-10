import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // In development, forward /api/* to the API's Function URL. In production
      // CloudFront serves the same /api/* path, so the app's code doesn't change.
      proxy: env.LIFTLENS_API_URL
        ? { '/api': { target: env.LIFTLENS_API_URL, changeOrigin: true } }
        : undefined,
    },
  }
})
