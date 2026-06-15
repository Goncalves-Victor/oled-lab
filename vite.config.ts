import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuracao basica do Vite com suporte a React + TypeScript.
export default defineConfig({
  // Caminhos relativos: faz o build funcionar no GitHub Pages
  // (servido em /<nome-do-repo>/) sem depender do nome do repositorio.
  base: './',
  plugins: [react()],
  server: {
    host: true, // permite abrir pelo celular na mesma rede (ex: http://192.168.x.x:5173)
    port: 5173,
  },
});
