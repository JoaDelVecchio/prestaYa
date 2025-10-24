import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const FALLBACK_SECRET = 'dev-super-secret';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
  context?: {
    orgId: string;
    userId: string;
    role: string;
    email?: string;
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

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
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

    request.user = {
      id: payload.sub,
      email: payload.email,
      role
    };

    request.context = {
      orgId,
      userId: payload.sub,
      role,
      email: payload.email
    };

    return true;
  }
}
