type TypeOfTag = 'undefined' | 'number' | 'bigint' | 'boolean' | 'string' | 'symbol' | 'object' | 'function'
type TypeOfTagType = {
  undefined: undefined
  number: number
  bigint: bigint
  boolean: boolean
  string: string
  symbol: symbol
  object: object
  function: Function
}

type TokenizedType = 'bigint' | 'symbol'
type TokenizedTagType = Pick<TypeOfTagType, TokenizedType>

interface TokenizedTypeConverter<T extends TokenizedType> {
  (input: string): TypeOfTagType[T]
}

type TokenizedTypeConverterEntry<T extends TokenizedType = TokenizedType> = [
  T,
  ReturnType<typeof typeToken>,
  TokenizedTypeConverter<T>,
]

const TOKEN_PREFIX = '::__' as const
const TOKEN_SUFFIX = '__::' as const

function typeToken<T extends TokenizedType>(
  type: T,
): `${typeof TOKEN_PREFIX}${typeof type}${typeof TOKEN_SUFFIX}` {
  return `${TOKEN_PREFIX}${type}${TOKEN_SUFFIX}`
}

const TOKENIZED_CONVERTERS: TokenizedTypeConverterEntry[] = [
  ['bigint', typeToken('bigint'), BigInt],
  ['symbol', typeToken('symbol'), Symbol.for.bind(Symbol)],
]

const TOKENS: { [TType in TokenizedType]: string } = TOKENIZED_CONVERTERS.reduce((result, [type, token]) => {
  result[type] = token
  return result
}, {} as { [TType in TokenizedType]: string })

function tokenize<T extends TokenizedType>(
  value: TokenizedTagType[T],
): `${ReturnType<typeof typeToken>}${string}` {
  const type = typeof value as T
  return `${TOKENS[type]}${value}`
}

function isTokenizedType(type: TypeOfTag): type is TokenizedType {
  return TOKENS.hasOwnProperty(type)
}

export const json = {
  stringify(obj: unknown): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        const valueType = typeof value
        if (isTokenizedType(valueType)) {
          return tokenize(value)
        }
        return value
      })
    } catch (err) {
      debugger
      throw err
    }
  },
  parse<T>(input: string, validator?: (obj: unknown) => obj is T): T {
    try {
      const parsed = JSON.parse(input, (key, value) => {
        if (typeof value === 'string' && value.startsWith(TOKEN_PREFIX)) {
          for (const [, token, converter] of TOKENIZED_CONVERTERS) {
            if (value.startsWith(token)) {
              return converter(value.substring(token.length))
            }
          }
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
    } catch (err) {
      debugger
      throw err
    }
  },
}
