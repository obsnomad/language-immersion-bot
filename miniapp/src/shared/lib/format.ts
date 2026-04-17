export function prettify(value: string): string {
  return String(value).replaceAll('_', ' ');
}

export function isUnauthorized(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
}
