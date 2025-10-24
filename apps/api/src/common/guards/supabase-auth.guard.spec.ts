import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import jwt from 'jsonwebtoken';

describe('SupabaseAuthGuard', () => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false as any);
  const guard = new SupabaseAuthGuard(reflector);
  const secret = 'dev-super-secret';

  it('allows access with valid token and sets context', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'user@example.com', org_id: 'org-1', role: 'owner' }, secret);
    const request: any = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const context = new ExecutionContextHost([request]);
    expect(guard.canActivate(context)).toBe(true);
    expect(request.context.orgId).toBe('org-1');
    expect(request.user.role).toBe('owner');
  });

  it('rejects when missing header', () => {
    const request: any = {
      headers: {}
    };
    const context = new ExecutionContextHost([request]);

    expect(() => guard.canActivate(context)).toThrow('Missing authorization header');
  });

  it('skips auth when route is public', () => {
    const reflectorMock = {
      getAllAndOverride: jest.fn().mockReturnValue(true)
    } as unknown as Reflector;
    const publicGuard = new SupabaseAuthGuard(reflectorMock);
    const context = new ExecutionContextHost([{}]);

    expect(publicGuard.canActivate(context)).toBe(true);
  });
});
