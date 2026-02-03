import { resolve } from 'path'

import { describe, it, expect } from 'vitest'

import { forEach, getVersion } from '../helpers'

describe('forEach', () => {
  it('iterates over array items sequentially', async () => {
    const results: number[] = []
    await forEach([1, 2, 3], async (item) => {
      await Promise.resolve()
      results.push(item)
    })
    expect(results).toEqual([1, 2, 3])
  })

  it('provides correct index and array to callback', async () => {
    const indices: number[] = []
    const array = ['a', 'b', 'c']
    await forEach(array, async (item, index, arr) => {
      await Promise.resolve()
      indices.push(index)
      expect(arr).toBe(array)
    })
    expect(indices).toEqual([0, 1, 2])
  })

  it('handles empty array', async () => {
    const results: unknown[] = []
    await forEach([], async (item) => {
      await Promise.resolve()
      results.push(item)
    })
    expect(results).toEqual([])
  })

  it('awaits each callback before proceeding', async () => {
    const results: number[] = []
    await forEach([1, 2, 3], async (item) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      results.push(item)
    })
    expect(results).toEqual([1, 2, 3])
  })
})

describe('getVersion', () => {
  const fixturesDir = resolve(__dirname, 'fixtures')

  describe('with package.json path', () => {
    it('reads version from package.json and prefixes with v', () => {
      const version = getVersion(`${fixturesDir}/package.json`)
      expect(version).toBe('v2.5.0')
    })

    it('does not double-prefix version that already has v', () => {
      const version = getVersion(`${fixturesDir}/with-v/package.json`)
      expect(version).toBe('v3.0.0')
    })

    it('returns empty string when package.json has no version', () => {
      const version = getVersion(`${fixturesDir}/no-version/package.json`)
      expect(version).toBe('')
    })

    it('returns empty string when package.json does not exist', () => {
      const version = getVersion(`${fixturesDir}/nonexistent/package.json`)
      expect(version).toBe('')
    })
  })

  describe('with arbitrary string', () => {
    it('returns the string as-is for commit SHA', () => {
      const sha = 'abc123def456'
      expect(getVersion(sha)).toBe('abc123def456')
    })

    it('returns the string as-is for custom version', () => {
      expect(getVersion('my-custom-version')).toBe('my-custom-version')
    })

    it('returns the string as-is for branch name', () => {
      expect(getVersion('feature/my-branch')).toBe('feature/my-branch')
    })
  })
})
