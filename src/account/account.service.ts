import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CheckTokensDto,
  RefreshTokenDto,
  RegisterDto,
  LoginDto,
} from './account.dto';
import { User } from 'src/entities/user';
import { HashingService } from './hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ActiveUserData } from './interfaces/active-user-data.interface';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly hashingService: HashingService,

    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async getUserinfo(uid: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: uid,
      },
      select: ['id', 'username', 'created_at'],
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  // 注册
  async register(body: RegisterDto) {
    const { username, password } = body;
    const usernameExisted = await this.isUsernameExist(username);
    if (usernameExisted) {
      throw new Error('用户名已被注册');
    }

    const user = await this.userRepository.save({
      username,
      password: await this.hashingService.hash(password),
    });

    return await this.generateTokens(user);
  }

  // 登录
  async login(body: LoginDto) {
    const user = await this.userRepository.findOne({
      where: {
        username: body.username,
      },
      select: {
        id: true,
        username: true,
        password: true,
        created_at: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    const isEqual = await this.hashingService.compare(
      body.password,
      user.password,
    );
    if (!isEqual) {
      throw new UnauthorizedException('密码错误');
    }

    return await this.generateTokens(user);
  }

  // 刷新tokens
  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'>
      >(refreshTokenDto.refresh_token, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.userRepository.findOneByOrFail({
        id: sub,
      });
      return this.generateTokens(user);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  async checkTokens(tokens: CheckTokensDto) {
    try {
      const { sub: sub1 } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'>
      >(tokens.refresh_token, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const { sub: sub2 } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'>
      >(tokens.accessToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });
      if (sub1 === sub2) {
        return {
          status: true,
        };
      } else {
        throw new UnauthorizedException();
      }
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  async isUsernameExist(username: string) {
    const user = await this.userRepository.findOneBy({
      username,
    });
    if (user) {
      return true;
    }
    return false;
  }

  async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { username: user.username },
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);
    return {
      accessToken,
      refreshToken,
      // accessTokenTtl: this.jwtConfiguration.accessTokenTtl,
      // refreshTokenTtl: this.jwtConfiguration.refreshTokenTtl,
    };
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
