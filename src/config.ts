import path from 'path'

import { getInput } from 'action-input-parser'

export interface Config {
  source: string
  outDir: string
  spaceName: string
  spaceRegion: string
  accessKey: string
  secretKey: string
  versioning: string
  cdnDomain: string | undefined
  permission: string
}

const config: Config = {
  source: getInput({
    key: 'source',
    required: true,
    modifier: (val: string) => {
      return path.join(process.cwd(), val)
    },
  }) as string,
  outDir: getInput({
    key: 'out_dir',
    default: '',
  }) as string,
  spaceName: getInput({
    key: 'space_name',
    required: true,
  }) as string,
  spaceRegion: getInput({
    key: 'space_region',
    required: true,
  }) as string,
  accessKey: getInput({
    key: 'access_key',
    required: true,
  }) as string,
  secretKey: getInput({
    key: 'secret_key',
    required: true,
  }) as string,
  versioning: getInput({
    key: 'versioning',
    default: 'false',
  }) as string,
  cdnDomain: getInput({
    key: 'cdn_domain',
  }),
  permission: getInput({
    key: 'permission',
    default: 'public-read',
  }) as string,
}

export default config
