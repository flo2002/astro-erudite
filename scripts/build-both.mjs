import { spawnSync } from 'node:child_process'

const bunCmd = process.platform === 'win32' ? 'bun.exe' : 'bun'

function runOrThrow(stepName, command, args) {
  console.log(`Running: ${stepName}`)

  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  })

  if (result.status !== 0) {
    const combinedOutput = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim()

    if (combinedOutput.length > 0) {
      const tail = combinedOutput.split('\n').slice(-40).join('\n')
      console.error(tail)
    }

    process.exit(result.status ?? 1)
  }
}

runOrThrow('astro check (islands)', bunCmd, ['run', 'astro', 'check'])
runOrThrow('astro build (islands)', bunCmd, ['run', 'astro', 'build', '--outDir', 'dist-islands'])

runOrThrow('astro check (spa)', bunCmd, ['run', 'astro', 'check', '--config', 'astro.config.spa.ts'])
runOrThrow('astro build (spa)', bunCmd, ['run', 'astro', 'build', '--config', 'astro.config.spa.ts', '--outDir', 'dist-no-islands'])

console.log('Built both variants: dist-islands and dist-no-islands')
