import fs from 'fs'

import { S3Client, PutObjectCommand, type ObjectCannedACL } from '@aws-sdk/client-s3'
import { lookup } from 'mime-types'

export interface S3Config {
  bucket: string
  region: string
  access_key: string
  secret_key: string
  permission: string
}

export default class S3Interface {
  private bucket: string
  private permission: string
  private s3: S3Client

  constructor(config: S3Config) {
    this.bucket = config.bucket
    this.permission = config.permission

    this.s3 = new S3Client({
      endpoint: `https://${config.region}.digitaloceanspaces.com`,
      region: config.region,
      credentials: {
        accessKeyId: config.access_key,
        secretAccessKey: config.secret_key,
      },
    })
  }

  async upload(file: string, path: string): Promise<void> {
    const fileStream = fs.createReadStream(file)
    const fileStats = fs.statSync(file)

    const command = new PutObjectCommand({
      Body: fileStream,
      Bucket: this.bucket,
      Key: path.replace(/\\/g, '/'),
      ACL: this.permission as ObjectCannedACL,
      ContentType: lookup(file) || 'text/plain',
      ContentLength: fileStats.size,
    })

    await this.s3.send(command)
  }
}
