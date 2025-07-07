import { Controller, Get, Query, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('by-email')
  async findByEmail(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }
}
