import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: '../../public/themes/aurora',
        manifest: true,
        rollupOptions: {
            input: {
                app: resolve(__dirname, 'sass/app.scss'),
            },
        },
    },
    plugins: [
        laravel({
            input: ['sass/app.scss'],
            refresh: true,
        }),
    ],
});
