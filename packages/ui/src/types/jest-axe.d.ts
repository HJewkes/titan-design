declare module 'jest-axe' {
  export function axe(
    html: Element | string,
    options?: Record<string, unknown>
  ): Promise<{ violations: unknown[] }>

  export const toHaveNoViolations: {
    toHaveNoViolations(results: { violations: unknown[] }): { pass: boolean; message(): string }
  }

  export function configureAxe(options?: Record<string, unknown>): typeof axe
}
