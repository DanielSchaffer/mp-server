const BIGINT_TOKEN = '__bigint__'

export const json = {
  stringify(obj: unknown): string {
    return JSON.stringify(obj, (key, value) => {
      return typeof value === 'bigint' ? `${BIGINT_TOKEN}${value}` : value
    })
  },
  parse<T>(input: string, validator?: (obj: unknown) => obj is T): T {
    const parsed = JSON.parse(input, (key, value) => {
      if (typeof value === 'string' && value.startsWith(BIGINT_TOKEN)) {
        return BigInt(value.substr(BIGINT_TOKEN.length))
      }
      return value
    })
    if (typeof validator === 'function') {
      if (validator(parsed)) {
        return parsed
      }
      throw new Error('Parsed object did not pass validator check')
    }
    return parsed
  }
}
