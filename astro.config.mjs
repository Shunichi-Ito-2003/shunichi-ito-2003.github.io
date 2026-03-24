// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://shunichi-ito-2003.github.io',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});