import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQEST_USER_KEY } from '../account.constants';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData | undefined = request[REQEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
