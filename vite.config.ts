import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps built asset paths relative so the prototype can be served
// from any sub-path (e.g. a static host) without extra configuration.
export default defineConfig({
  plugins: [react()],
  base: './',
})
