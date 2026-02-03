declare module 'action-input-parser' {
  interface GetInputOptions {
    key: string
    required?: boolean
    default?: string
    modifier?: (value: string) => string
  }

  export function getInput(options: GetInputOptions): string | undefined
}
