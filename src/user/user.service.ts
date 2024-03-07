import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  async getUserinfo(uid: number) {
    return uid;
  }
}
