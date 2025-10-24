import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  orgId: string;
  userId: string;
  role: string;
  email?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): RequestContext {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error('Request context not available');
    }
    return store;
  }
}
