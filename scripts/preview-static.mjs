import { createServer } from 'node:http'
import { promises as fs } from 'node:fs'
import path from 'node:path'

function parseArg(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index === -1) return fallback
  return process.argv[index + 1] ?? fallback
}

const rootDir = path.resolve(parseArg('--dir', 'dist'))
const host = parseArg('--host', '127.0.0.1')
const port = Number(parseArg('--port', '3000'))

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  return mimeTypes[extension] ?? 'application/octet-stream'
}

function safePathFromUrlPath(urlPath) {
  const decoded = decodeURIComponent(urlPath)
  const normalized = path.posix.normalize(decoded)
  const trimmed = normalized.replace(/^\/+/, '')
  if (trimmed.startsWith('..')) return null
  return trimmed
}

async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath)
    return stats.isFile()
  } catch {
    return false
  }
}

async function serveFile(res, filePath) {
  const data = await fs.readFile(filePath)
  res.writeHead(200, {
    'Content-Type': getContentType(filePath),
    'Cache-Control': 'no-cache',
  })
  res.end(data)
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `${host}:${port}`}`)
    const safeRelativePath = safePathFromUrlPath(requestUrl.pathname)

    if (safeRelativePath === null) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Bad request')
      return
    }

    const absolutePath = path.join(rootDir, safeRelativePath)

    let stats
    try {
      stats = await fs.stat(absolutePath)
    } catch {
      stats = null
    }

    if (stats?.isDirectory()) {
      if (!requestUrl.pathname.endsWith('/')) {
        res.writeHead(308, { Location: `${requestUrl.pathname}/${requestUrl.search}` })
        res.end()
        return
      }

      const indexFile = path.join(absolutePath, 'index.html')
      if (await fileExists(indexFile)) {
        await serveFile(res, indexFile)
        return
      }
    }

    if (stats?.isFile()) {
      await serveFile(res, absolutePath)
      return
    }

    const htmlFile = `${absolutePath}.html`
    if (await fileExists(htmlFile)) {
      await serveFile(res, htmlFile)
      return
    }

    const directoryIndex = path.join(absolutePath, 'index.html')
    if (await fileExists(directoryIndex)) {
      res.writeHead(308, { Location: `${requestUrl.pathname.endsWith('/') ? requestUrl.pathname : `${requestUrl.pathname}/`}${requestUrl.search}` })
      res.end()
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(error instanceof Error ? error.message : 'Internal server error')
  }
})

server.on('error', (error) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`)
    process.exit(1)
  }

  console.error(error)
  process.exit(1)
})

server.listen(port, host, () => {
  console.log(`Serving ${rootDir} on http://${host}:${port}`)
})
