import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestContext, RequestWithContext } from './request-context';

@Injectable()
export class RequestContextService {
  private readonly requestStorage = new AsyncLocalStorage<RequestWithContext>();
  private readonly contexts = new WeakMap<RequestWithContext, RequestContext>();

  runWithRequest<T>(request: RequestWithContext, callback: () => T): T {
    return this.requestStorage.run(request, callback);
  }

  run<T>(context: RequestContext, callback: () => T): T {
    const request: RequestWithContext = { context } as RequestWithContext;
    this.contexts.set(request, context);
    return this.runWithRequest(request, callback);
  }

  setContext(request: RequestWithContext, context: RequestContext): void {
    this.contexts.set(request, context);
  }

  get(): RequestContext {
    const request = this.requestStorage.getStore();
    if (!request) {
      throw new Error('Request context not available');
    }
    const context = this.contexts.get(request);
    if (!context) {
      throw new Error('Request context not available');
    }
    return context;
  }
}
