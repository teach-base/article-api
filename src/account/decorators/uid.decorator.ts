import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { REQEST_USER_KEY } from '../account.constants';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

export const Uid = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData | undefined = request[REQEST_USER_KEY];
    if (!user) {
      throw new ForbiddenException();
    }
    return user.sub;
  },
);
