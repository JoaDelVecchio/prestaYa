import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @Roles('owner', 'supervisor')
  list() {
    return this.users.list();
  }
}
