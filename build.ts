import { join } from 'path';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';

const PROJECT_ROOT = import.meta.dir;
const SRC_DIR = join(PROJECT_ROOT, 'src');
const PUBLIC_DIR = join(PROJECT_ROOT, 'public');
const ASSETS_DIR = join(PUBLIC_DIR, 'assets');

async function buildJS() {
  const result = await Bun.build({
    entrypoints: [join(SRC_DIR, 'index.tsx')],
    outdir: ASSETS_DIR,
    minify: false,
    sourcemap: 'external',
    target: 'browser',
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
  });

  if (!result.success) {
    console.error('❌ Build JS falhou:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Rename the output file to app.js
  const outputFile = result.outputs[0];
  if (outputFile) {
    const content = await outputFile.text();
    await Bun.write(join(ASSETS_DIR, 'app.js'), content);
    // Remove o arquivo de saída temporário caso o nome seja diferente de "app.js"
    if (outputFile.path !== join(ASSETS_DIR, 'app.js')) {
      const fs = await import('fs');
      try {
        fs.unlinkSync(outputFile.path);
      } catch {}
    }
  }

  console.log('✅ JS compilado com sucesso');
}

async function buildCSS() {
  const cssInput = await Bun.file(join(SRC_DIR, 'styles.css')).text();

  const processor = postcss([tailwindcss()]);
  const result = await processor.process(cssInput, {
    from: join(SRC_DIR, 'styles.css'),
    to: join(ASSETS_DIR, 'styles.css'),
  });

  await Bun.write(join(ASSETS_DIR, 'styles.css'), result.css);
  console.log('✅ CSS compilado com sucesso');
}

async function build() {
  console.log('🔨 Iniciando build...');

  // Ensure assets directory exists
  const fs = await import('fs');
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  await buildJS();
  await buildCSS();
  console.log('🎉 Build concluído!');
}

build();
