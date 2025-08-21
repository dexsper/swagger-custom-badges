import { Controller, Get } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello-old')
  @ApiExtension('x-deprecated', {
    reason: 'This endpoint is deprecated',
    since: '1.0.0',
    until: '2.0.0',
  })
  getHelloOld(): string {
    return this.appService.getHello();
  }

  @Get('hello')
  @ApiExtension('x-roles', {
    globalRoles: ['Admin'],
    relationRoles: ['UserOwner'],
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
