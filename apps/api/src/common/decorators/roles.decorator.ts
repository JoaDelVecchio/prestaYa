import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'allowed_roles';

export type Role = 'owner' | 'supervisor' | 'caja' | 'readonly';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
