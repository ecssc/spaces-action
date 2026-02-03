import path from 'path'

import * as core from '@actions/core'

export interface Config {
  source: string
  outDir: string
  spaceName: string
  spaceRegion: string
  accessKey: string
  secretKey: string
  versioning: string
  uploadLatest: boolean
  cdnDomain: string | undefined
  permission: string
}

const requiredInputs = [
  'source',
  'space_name',
  'space_region',
  'access_key',
  'secret_key',
] as const

function validateRequiredInputs(): void {
  const missing: string[] = []

  for (const input of requiredInputs) {
    if (!core.getInput(input)) {
      missing.push(input)
    }
  }

  if (missing.length > 0) {
    core.setFailed(
      `Missing required inputs:\n${missing.map((input) => `  - ${input}`).join('\n')}\n\nPlease check your workflow configuration.`
    )
    process.exit(1)
  }
}

validateRequiredInputs()

const config: Config = {
  source: path.join(process.cwd(), core.getInput('source')),
  outDir: core.getInput('out_dir') || '',
  spaceName: core.getInput('space_name'),
  spaceRegion: core.getInput('space_region'),
  accessKey: core.getInput('access_key'),
  secretKey: core.getInput('secret_key'),
  versioning: core.getInput('versioning') || 'false',
  uploadLatest: core.getInput('upload_latest') === 'true',
  cdnDomain: core.getInput('cdn_domain') || undefined,
  permission: core.getInput('permission') || 'public-read',
}

export default config
