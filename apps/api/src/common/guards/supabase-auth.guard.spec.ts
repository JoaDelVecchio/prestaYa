import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import jwt from 'jsonwebtoken';
import { RequestContextService } from '../request-context.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('SupabaseAuthGuard', () => {
  const reflector = new Reflector();
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockImplementation((metadataKey: unknown) => {
      if (metadataKey === IS_PUBLIC_KEY) {
        return false;
      }
      if (metadataKey === ROLES_KEY) {
        return undefined;
      }
      return undefined;
    });
  const contextService = new RequestContextService();
  const guard = new SupabaseAuthGuard(reflector, contextService);
  const secret = 'dev-super-secret';

  it('allows access with valid token and sets context', () => {
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'user@example.com',
        org_id: 'org-1',
        role: 'owner',
      },
      secret,
    );
    const request: any = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const context = new ExecutionContextHost([request]);
    const result = contextService.runWithRequest(request, () => {
      const allowed = guard.canActivate(context);
      const stored = contextService.get();
      expect(stored.orgId).toBe('org-1');
      expect(stored.role).toBe('owner');
      return allowed;
    });

    expect(result).toBe(true);
    expect(request.context.orgId).toBe('org-1');
    expect(request.user.role).toBe('owner');
  });

  it('rejects when missing header', () => {
    const request: any = {
      headers: {},
    };
    const context = new ExecutionContextHost([request]);

    expect(() => guard.canActivate(context)).toThrow(
      'Missing authorization header',
    );
  });

  it('skips auth when route is public', () => {
    const reflectorMock = {
      getAllAndOverride: jest
        .fn()
        .mockImplementation((metadataKey: unknown) => {
          if (metadataKey === IS_PUBLIC_KEY) {
            return true;
          }
          return undefined;
        }),
    } as unknown as Reflector;
    const publicGuard = new SupabaseAuthGuard(reflectorMock, contextService);
    const context = new ExecutionContextHost([{}]);

    expect(publicGuard.canActivate(context)).toBe(true);
  });

  it('denies access when role is not allowed', () => {
    const reflectorMock = {
      getAllAndOverride: jest
        .fn()
        .mockImplementation((metadataKey: unknown) => {
          if (metadataKey === IS_PUBLIC_KEY) {
            return false;
          }
          if (metadataKey === ROLES_KEY) {
            return ['owner'];
          }
          return undefined;
        }),
    } as unknown as Reflector;
    const roleGuard = new SupabaseAuthGuard(reflectorMock, contextService);
    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'user@example.com',
        org_id: 'org-1',
        role: 'readonly',
      },
      secret,
    );
    const request: any = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const context = new ExecutionContextHost([request]);

    expect(() =>
      contextService.runWithRequest(request, () =>
        roleGuard.canActivate(context),
      ),
    ).toThrow('Insufficient role');
  });
});
