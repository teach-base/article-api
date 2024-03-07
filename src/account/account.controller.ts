import {
  Body,
  Controller,
  Get,
  Post,
  // Req,
  // Request,
} from '@nestjs/common';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  CheckTokensDto,
} from './account.dto';
import { AuthType } from './account.enums';
import { AccountService } from './account.service';
import { Auth } from './decorators/auth.decorator';
import { Uid } from './decorators/uid.decorator';

@Auth(AuthType.None)
@Controller('account')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return await this.service.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.service.login(body);
  }

  @Post('refresh-tokens')
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.service.refreshTokens(refreshTokenDto);
  }

  @Post('check-tokens')
  async checkTokens(@Body() tokens: CheckTokensDto) {
    return await this.service.checkTokens(tokens);
  }

  @Auth(AuthType.Bearer)
  @Get('userinfo')
  async getUserinfo(@Uid() uid: number) {
    return await this.service.getUserinfo(uid);
  }
}
