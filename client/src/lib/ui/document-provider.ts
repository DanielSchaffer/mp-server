import { Provider } from '@dandi/core'

async function documentFactory(): Promise<Document> {
  return await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => resolve(document))
    } else {
      resolve(document)
    }
  })
}

export const DocumentProvider: Provider<Document> = {
  provide: Document,
  useFactory: documentFactory,
  async: true,
  multi: false,
}
