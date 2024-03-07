import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { Uid } from 'src/account/decorators/uid.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}
  @Get()
  async getUserinfo(@Uid() uid: number) {
    return this.service.getUserinfo(uid);
  }
}
