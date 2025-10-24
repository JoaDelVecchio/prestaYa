import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as {
      context?: { role?: string };
      user?: { role?: string };
    };
    const role = request?.context?.role ?? request?.user?.role;

    if (!role) {
      throw new ForbiddenException('Missing role information');
    }

    if (allowedRoles.includes(role as Role)) {
      return true;
    }

    throw new ForbiddenException('Insufficient role');
  }
}
