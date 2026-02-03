import fs from 'fs'

export async function forEach<T>(
  array: T[],
  callback: (item: T, index: number, array: T[]) => Promise<void>
): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export function getVersion(value: string): string {
  // If it's 'true', use package.json in current directory
  // If it ends with 'package.json', treat it as a path to package.json
  // Otherwise, use the value directly as the version string

  if (value === 'true' || value.endsWith('package.json')) {
    try {
      const pkgPath = value === 'true' ? 'package.json' : value
      const raw = fs.readFileSync(pkgPath).toString()
      const pkg = JSON.parse(raw) as { version?: string }
      const version = pkg.version
      if (!version) return ''
      return version.charAt(0) !== 'v' ? `v${version}` : version
    } catch {
      return ''
    }
  }

  // Use the value directly as version string
  return value
}
