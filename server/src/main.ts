import { server } from './server-container'

function main(): void {
  server.start().catch((err) => {
    console.error(err)
    return Promise.reject(err)
  })
}
main()
