import { client } from './client-container'

import '../sass/main.scss'

function main(): void {
  client.start().catch((err) => {
    console.error(err)
    return Promise.reject(err)
  })
}
main()
