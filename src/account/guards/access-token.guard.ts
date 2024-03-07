import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { REQEST_USER_KEY } from '../account.constants';
import jwtConfig from '../config/jwt.config';
import { Request } from 'express';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      request[REQEST_USER_KEY] = payload;
    } catch (err) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    const arr = request.headers.authorization?.split(' ') ?? [];
    const token = arr[1];
    return token;
  }
}
