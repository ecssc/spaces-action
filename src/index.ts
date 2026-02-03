import fs from 'fs'
import path from 'path'

import * as core from '@actions/core'

import config from './config'
import { forEach, getVersion } from './helpers'
import S3Interface from './interface'

async function run(): Promise<void> {
  const shouldVersion = config.versioning !== 'false'

  let outDir = config.outDir
  if (shouldVersion) {
    const version = getVersion(config.versioning)
    core.info(`Using version: ${version}`)
    outDir = path.join(version, config.outDir)
  }

  core.info(`Target path: ${outDir || '(root)'}`)

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

    core.info(`Uploading: ${s3Path}${config.uploadLatest ? ' (+ latest)' : ''}`)
    await s3.upload(config.source, s3Path)
    uploadCount++

    if (config.uploadLatest) {
      const s3PathLatest = path.join('latest', config.outDir, fileName)
      await s3.upload(config.source, s3PathLatest)
      uploadCount++
    }
  } else {
    core.info(`Scanning directory: ${config.source}`)

    const uploadFolder = async (currentFolder: string): Promise<void> => {
      const files = await fs.promises.readdir(currentFolder)

      await forEach(files, async (file) => {
        const fullPath = path.join(currentFolder, file)
        const stat = await fs.promises.stat(fullPath)

        if (stat.isFile()) {
          const relativePath = path.relative(config.source, fullPath)
          const s3Path = path.join(outDir, relativePath)

          core.info(`Uploading: ${s3Path}${config.uploadLatest ? ' (+ latest)' : ''}`)
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

  core.info(`Upload complete! ${uploadCount} file(s) uploaded to ${outputPath}`)
  core.setOutput('output_url', outputPath)
}

run().catch((err: Error) => {
  core.error(err)
  core.setFailed(err.message)
})
