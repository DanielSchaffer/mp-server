import { Controller, HttpGet } from '@dandi/mvc'
import { View } from '@dandi/mvc-view'

@Controller('/')
export class ClientController {

  @HttpGet()
  @View('game.pug')
  public game(): void {
    return
  }

}
