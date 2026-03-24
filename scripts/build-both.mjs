import { spawnSync } from 'node:child_process'

const bunCmd = process.platform === 'win32' ? 'bun.exe' : 'bun'

function runOrThrow(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

runOrThrow(bunCmd, ['run', 'astro', 'check'])
runOrThrow(bunCmd, ['run', 'astro', 'build', '--outDir', 'dist-islands'])

runOrThrow(bunCmd, ['run', 'astro', 'check', '--config', 'astro.config.spa.ts'])
runOrThrow(bunCmd, ['run', 'astro', 'build', '--config', 'astro.config.spa.ts', '--outDir', 'dist-no-islands'])

console.log('Built both variants: dist-islands and dist-no-islands')
