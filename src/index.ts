import fs from 'fs'
import path from 'path'

import * as core from '@actions/core'

import config from './config'
import { getVersion, parallelLimit } from './helpers'
import S3Interface from './interface'

const CONCURRENCY_LIMIT = 10

const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
}

interface UploadTask {
  localPath: string
  s3Path: string
  displayPath: string
}

async function collectFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  async function scan(currentDir: string): Promise<void> {
    const entries = await fs.promises.readdir(currentDir)

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry)
      const stat = await fs.promises.stat(fullPath)

      if (stat.isFile()) {
        files.push(fullPath)
      } else {
        await scan(fullPath)
      }
    }
  }

  await scan(dir)
  return files
}

async function run(): Promise<void> {
  const shouldVersion = config.versioning !== 'false'

  let outDir = config.outDir
  if (shouldVersion) {
    const version = getVersion(config.versioning)
    core.info(
      `${colors.cyan}Using version:${colors.reset} ${colors.green}${version}${colors.reset}`
    )
    outDir = path.join(version, config.outDir)
  }

  core.info(
    `${colors.cyan}Target path:${colors.reset} ${colors.green}${outDir || '(root)'}${colors.reset}`
  )

  const s3 = new S3Interface({
    bucket: config.spaceName,
    region: config.spaceRegion,
    access_key: config.accessKey,
    secret_key: config.secretKey,
    permission: config.permission,
  })

  const fileStat = await fs.promises.stat(config.source)
  const isFile = fileStat.isFile()

  const tasks: UploadTask[] = []

  if (isFile) {
    const fileName = path.basename(config.source)
    tasks.push({
      localPath: config.source,
      s3Path: path.join(outDir, fileName),
      displayPath: fileName,
    })

    if (config.uploadLatest) {
      tasks.push({
        localPath: config.source,
        s3Path: path.join('latest', config.outDir, fileName),
        displayPath: `latest/${config.outDir ? config.outDir + '/' : ''}${fileName}`,
      })
    }
  } else {
    core.info(
      `${colors.cyan}Scanning directory:${colors.reset} ${colors.green}${config.source}${colors.reset}`
    )

    const files = await collectFiles(config.source)

    for (const fullPath of files) {
      const relativePath = path.relative(config.source, fullPath)

      tasks.push({
        localPath: fullPath,
        s3Path: path.join(outDir, relativePath),
        displayPath: path.join(outDir, relativePath),
      })

      if (config.uploadLatest) {
        tasks.push({
          localPath: fullPath,
          s3Path: path.join('latest', config.outDir, relativePath),
          displayPath: path.join('latest', config.outDir, relativePath),
        })
      }
    }
  }

  core.info(
    `${colors.cyan}Uploading ${tasks.length} file(s) with concurrency ${CONCURRENCY_LIMIT}...${colors.reset}`
  )

  await parallelLimit(tasks, CONCURRENCY_LIMIT, async (task) => {
    core.info(
      `${colors.cyan}Uploading:${colors.reset} ${colors.green}${task.displayPath}${colors.reset}`
    )
    await s3.upload(task.localPath, task.s3Path)
  })

  const outputPath = config.cdnDomain
    ? `https://${config.cdnDomain}/${outDir}`
    : `https://${config.spaceName}.${config.spaceRegion}.digitaloceanspaces.com/${outDir}`

  core.info(
    `${colors.cyan}Upload complete!${colors.reset} ${tasks.length} file(s) uploaded to ${colors.green}${outputPath}${colors.reset}`
  )
  core.setOutput('output_url', outputPath)
}

run().catch((err: Error) => {
  core.error(err)
  core.setFailed(err.message)
})
