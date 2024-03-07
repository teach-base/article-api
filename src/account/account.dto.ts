import { IsNumber, Length, IsNotEmpty, MinLength } from 'class-validator';
import { PickType } from '@nestjs/mapped-types';

class CommonDto {
  @IsNotEmpty()
  refresh_token: string;

  @IsNotEmpty()
  accessToken: string;

  @IsNumber()
  readonly id: number;

  @Length(4, 16)
  readonly username: string;

  @MinLength(6)
  readonly password: string;
}
export class RegisterDto extends PickType(CommonDto, [
  'username',
  'password',
]) {}
export class RefreshTokenDto extends PickType(CommonDto, ['refresh_token']) {}
export class CheckTokensDto extends PickType(CommonDto, [
  'refresh_token',
  'accessToken',
]) {}
export class LoginDto extends PickType(CommonDto, ['username', 'password']) {}
