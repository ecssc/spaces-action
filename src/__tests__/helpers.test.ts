import { resolve } from 'path'

import { describe, it, expect } from 'vitest'

import { parallelLimit, getVersion } from '../helpers'

describe('parallelLimit', () => {
  it('processes all items and returns results', async () => {
    const results = await parallelLimit([1, 2, 3], 2, (item) => Promise.resolve(item * 2))
    expect(results).toEqual([2, 4, 6])
  })

  it('handles empty array', async () => {
    const results = await parallelLimit([], 2, (item: number) =>
      Promise.resolve(item * 2)
    )
    expect(results).toEqual([])
  })

  it('respects concurrency limit', async () => {
    let concurrent = 0
    let maxConcurrent = 0

    await parallelLimit([1, 2, 3, 4, 5], 2, async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise((resolve) => setTimeout(resolve, 10))
      concurrent--
    })

    expect(maxConcurrent).toBeLessThanOrEqual(2)
  })

  it('processes items when limit exceeds array length', async () => {
    const results = await parallelLimit([1, 2], 10, (item) => Promise.resolve(item * 2))
    expect(results).toEqual([2, 4])
  })

  it('maintains result order regardless of completion order', async () => {
    const results = await parallelLimit([30, 10, 20], 3, async (delay) => {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return delay
    })
    expect(results).toEqual([30, 10, 20])
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
