import { client } from './client-container'

function main(): void {
  client.start().catch((err) => {
    console.error(err)
    return Promise.reject(err)
  })
}
main()
