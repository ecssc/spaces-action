import fs from 'fs'
import path from 'path'

import * as core from '@actions/core'

import config from './config'
import { forEach, getVersion } from './helpers'
import S3Interface from './interface'

const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
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

  let uploadCount = 0

  if (isFile) {
    const fileName = path.basename(config.source)
    const s3Path = path.join(outDir, fileName)

    core.info(
      `${colors.cyan}Uploading:${colors.reset} ${colors.green}${s3Path}${colors.reset}${config.uploadLatest ? `${colors.dim} (+ latest)${colors.reset}` : ''}`
    )
    await s3.upload(config.source, s3Path)
    uploadCount++

    if (config.uploadLatest) {
      const s3PathLatest = path.join('latest', config.outDir, fileName)
      await s3.upload(config.source, s3PathLatest)
      uploadCount++
    }
  } else {
    core.info(
      `${colors.cyan}Scanning directory:${colors.reset} ${colors.green}${config.source}${colors.reset}`
    )

    const uploadFolder = async (currentFolder: string): Promise<void> => {
      const files = await fs.promises.readdir(currentFolder)

      await forEach(files, async (file) => {
        const fullPath = path.join(currentFolder, file)
        const stat = await fs.promises.stat(fullPath)

        if (stat.isFile()) {
          const relativePath = path.relative(config.source, fullPath)
          const s3Path = path.join(outDir, relativePath)

          core.info(
            `${colors.cyan}Uploading:${colors.reset} ${colors.green}${s3Path}${colors.reset}${config.uploadLatest ? `${colors.dim} (+ latest)${colors.reset}` : ''}`
          )
          await s3.upload(fullPath, s3Path)
          uploadCount++

          if (config.uploadLatest) {
            const s3PathLatest = path.join('latest', config.outDir, relativePath)
            await s3.upload(fullPath, s3PathLatest)
            uploadCount++
          }
        } else {
          await uploadFolder(fullPath)
        }
      })
    }

    await uploadFolder(config.source)
  }

  const outputPath = config.cdnDomain
    ? `https://${config.cdnDomain}/${outDir}`
    : `https://${config.spaceName}.${config.spaceRegion}.digitaloceanspaces.com/${outDir}`

  core.info(
    `${colors.cyan}Upload complete!${colors.reset} ${uploadCount} file(s) uploaded to ${colors.green}${outputPath}${colors.reset}`
  )
  core.setOutput('output_url', outputPath)
}

run().catch((err: Error) => {
  core.error(err)
  core.setFailed(err.message)
})
