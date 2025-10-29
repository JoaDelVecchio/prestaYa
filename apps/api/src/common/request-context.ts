import { Request } from 'express';

export type RequestContext = {
  orgId: string;
  userId: string;
  role: string;
  email?: string;
};

export type RequestWithContext = Request & { context?: RequestContext };
