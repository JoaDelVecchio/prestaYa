import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContext, RequestWithContext } from '../request-context';
import { RequestContextService } from '../request-context.service';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

const FALLBACK_SECRET = 'dev-super-secret';

type AuthenticatedRequest = RequestWithContext & {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
};

type SupabaseJwtPayload = {
  sub: string;
  email?: string;
  role?: string;
  app_metadata?: {
    provider?: string;
    roles?: string[];
  };
  user_metadata?: Record<string, unknown> & {
    default_org_id?: string;
    roles?: Record<string, string>;
  };
  org_id?: string;
  orgs?: string[];
};

@Injectable({ scope: Scope.REQUEST })
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly contextService: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    this.logger.verbose('Evaluating Supabase auth guard');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const secret = process.env.SUPABASE_JWT_SECRET || FALLBACK_SECRET;

    let payload: SupabaseJwtPayload;
    try {
      payload = jwt.verify(token, secret) as SupabaseJwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    const orgIdHeader = request.headers['x-org-id'];
    const roleHeader = request.headers['x-user-role'];

    const orgId =
      (typeof orgIdHeader === 'string' && orgIdHeader) ||
      payload.org_id ||
      payload.user_metadata?.default_org_id ||
      payload.orgs?.[0];

    if (!orgId) {
      throw new UnauthorizedException('Missing org context');
    }

    const role =
      (typeof roleHeader === 'string' && roleHeader) ||
      payload.role ||
      payload.user_metadata?.roles?.[orgId] ||
      payload.app_metadata?.roles?.[0] ||
      'readonly';

    if (!role) {
      throw new ForbiddenException('Missing role information');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      role,
    };

    const requestContext: RequestContext = {
      orgId,
      userId: payload.sub,
      role,
      email: payload.email,
    };
    request.context = requestContext;
    this.contextService.setContext(request, requestContext);

    const allowedRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (allowedRoles?.length && !allowedRoles.includes(role as Role)) {
      throw new ForbiddenException('Insufficient role');
    }

    this.logger.debug(
      `Authenticated ${payload.sub} for org ${orgId} with role ${role}`,
    );

    return true;
  }
}
