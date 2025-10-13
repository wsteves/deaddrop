
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('polkadot')) return 'vendor-polkadot';
          if (id.includes('@dripdrop/chain')) return 'vendor-chain';
          return undefined;
        }
      }
    }
  }
})
