export const PromiseStatus = {
  resolved: 'resolved',
  rejected: 'rejected',
  pending: 'pending',
};

export class DeferredPromise<T> {
  private _promise: Promise<T>;
  private _resolve: ((value: T) => any);
  private _reject: ((error: any) => any);
  private _status: string;

  constructor(callback?: (deferred: DeferredPromise<T>) => any) {
    this._status = PromiseStatus.pending;

    this._promise = new Promise<T>((resolve: any, reject: any) => {
      this._resolve = resolve;
      this._reject = reject;

      if(callback !== void 0) { callback.call(this, this); }
    });

    this._promise.then(() => {
      this._status = PromiseStatus.resolved;
    }).catch(() => {
      this._status = PromiseStatus.rejected;
    });
  }

  get status(): string {
    return this._status;
  }

  get promise(): Promise<T> {
    return this._promise;
  }

  resolve(value?: T) {
    if(this._status === PromiseStatus.pending) {
      this._resolve(value);
    }
  }

  reject(reason: any) {
    if(this._status === PromiseStatus.pending) {
      this._reject(reason);
    }
  }

  then<A>(callback: ((result: T) => any)): DeferredPromise<A> {
    return new DeferredPromise<A>((deferred: DeferredPromise<A>) => {
      this._promise.then((result: T) => {
        let _return: A = callback(result);
        deferred.resolve(_return);
      }).catch((reason: any) => {
        deferred.reject(reason);
      });
    });
  }

  catch<A>(callback: ((reason: any) => any)): DeferredPromise<A> {
    return new DeferredPromise<A>((deferred: DeferredPromise<A>) => {
      this._promise.then((result: T) => {
        deferred.resolve(<any>result);
      }).catch((reason: any) => {
        let _return: any;
        try {
          _return = callback(reason);
        } catch(error) {
          deferred.reject(error);
        }
        deferred.resolve(_return);
      });
    });
  }

}
