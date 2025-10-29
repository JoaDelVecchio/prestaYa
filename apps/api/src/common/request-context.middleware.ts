import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';
import { RequestWithContext } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    this.context.runWithRequest(req, () => next());
  }
}
