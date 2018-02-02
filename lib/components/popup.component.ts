import {
  Component, ViewContainerRef, ViewChild, ElementRef, AfterViewInit, HostListener
} from '@angular/core';
import { NgxDOMComponent, NgxDOMComponentContainer, NgxDOMComponentService } from 'ngx-dom-component';
import { IPopupConfig } from '../services/ngx-popup.service';
import { DeferredPromise } from '../classes/DeferredPromise';

export enum NgxPopupState {
  CLOSED = 'closed',
  CLOSING = 'closing',
  OPENED = 'opened',
  OPENING = 'opening'
}

export type TNgxPopupState = 'closed' | 'closing' | 'opened' | 'opening' | NgxPopupState;

@Component({
  selector: 'ngx-popup',
  template: `
   <div class="content">
    <ng-template #contentContainer></ng-template>
   </div>
  `
})
export class NgxPopupComponent implements AfterViewInit {

  @ViewChild('contentContainer', { read: ViewContainerRef })
  protected contentContainer: ViewContainerRef;

  protected _closableListener: (() => void) | null;
  protected _backgroundClosable: boolean;

  protected _ngxDOMComponentContainer: NgxDOMComponentContainer;
  protected _ngxDOMComponent: NgxDOMComponent;

  protected _openPromise: DeferredPromise<void> | null;
  protected _closePromise: DeferredPromise<void> | null;

  protected _state: TNgxPopupState;
  protected _element: HTMLElement;

  constructor(private ngxDOMComponentService: NgxDOMComponentService,
              element: ElementRef) {
    this._closableListener    = null;
    this._backgroundClosable  = true;
    this._openPromise         = null;
    this._closePromise        = null;
    this._state = NgxPopupState.CLOSED;
    this._element = element.nativeElement;
  }

  /**
   * Returns the instance of the injected component.
   */
  get contentInstance(): any {
    return this._ngxDOMComponent.instance;
  }

  /**
   * Returns the DOM element of the popup
   * @returns {HTMLElement}
   */
  get element(): HTMLElement {
    return this._element;
  }

  get state(): TNgxPopupState {
    return this._state;
  }


  get closable(): boolean {
    return this._closableListener === null;
  }

  set closable(value: boolean) {
    value = Boolean(value);
    const closable: boolean = (this._closableListener === null);
    if (value !== closable) {
      if (closable) { // switch from true to false
        const listener = (event: Event) => {
          event.preventDefault();
        };

        this.addEventListener('beforeclose', listener);
        this._closableListener = () => {
          this.removeEventListener('beforeclose', listener);
          this._closableListener = null;
        };
      } else { // switch from false to true
        this._closableListener();
      }
    }
  }

  get backgroundClosable(): boolean {
    return this._backgroundClosable;
  }

  set backgroundClosable(value: boolean) {
    this._backgroundClosable = Boolean(value);
  }


  ngAfterViewInit() {
    this._ngxDOMComponentContainer = this.ngxDOMComponentService.createContainer(this.contentContainer);
    requestAnimationFrame(() => { // allows css to apply without the class 'open'
      this.dispatchEvent(new CustomEvent('ready'));
    });
  }


  /**
   * The following events are available
   *
   * - open : after the popup is opened (including transition or not, according to 'waitTransitionEnd').
   * - close : after the popup is closed (including transition or not, according to 'waitTransitionEnd').
   * - beforeclose : when the close method is called. Use event.preventDefault() to cancel close.
   * - cancelopen : when an open is cancelled (ex: while animating, the popup is in a 'opening' state,
   *                if you call close before animation is complete, it cancels the open).
   *
   * All of them are CustomEvent, with a detail property that you can set when calling open or close.
   */

  addEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: any): void {
    return this._element.addEventListener(type, listener, useCapture);
  }

  dispatchEvent(event: Event): boolean {
    return this._element.dispatchEvent(event);
  }

  removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: any): void {
    return this._element.removeEventListener(type, listener, useCapture);
  }


  open(config: IPopupConfig, waitTransitionEnd: boolean = true, detail?: any): Promise<void> {
    if (this._openPromise === null) {
      this._openPromise = new DeferredPromise<void>(() => {
        switch (this._state) {
          case NgxPopupState.CLOSED:
          case NgxPopupState.CLOSING:
            const beforeOpenPrevented: boolean = !this.dispatchEvent(new CustomEvent('beforeopen', {
              detail: detail,
              bubbles: false,
              cancelable: true
            }));

            if (beforeOpenPrevented) {
              this._openPromise.reject(new Error(`Open prevented`));
            } else {
              if (this._state === NgxPopupState.CLOSING) {
                this.dispatchEvent(new CustomEvent('cancelclose'));
                this._closePromise.reject(new Error(`Close cancelled`));
              }

              this._state = NgxPopupState.OPENING;
              this._build(config);

              requestAnimationFrame(() => { // allows content to be rendered before adding 'open'
                this._element.classList.add('open');
                if (waitTransitionEnd) {
                  this._waitTransitionEnd().then(() => {
                    if (this._openPromise !== null) {
                      this._openPromise.resolve();
                    }
                  });
                } else {
                  this._openPromise.resolve();
                }
              });
            }
            break;
          default:
            this._openPromise.reject(new Error(`Popup not closed`));
            break;
        }
      });

      this._openPromise
        .then(() => {
          this._state = NgxPopupState.OPENED;
          this._openPromise = null;
          this.dispatchEvent(new CustomEvent('open', {
            detail: detail
          }));
        }, () => {
          this._openPromise = null;
        });
    }

    return this._openPromise.promise;
  }

  /**
   * Close the popup.
   *
   * @param waitTransitionEnd
   * @param detail
   * @returns {Promise<void>} - promise resolved when the popup is closed
   */
  close(waitTransitionEnd: boolean = true, detail?: any): Promise<void> {
    if (this._closePromise === null) {
      this._closePromise = new DeferredPromise<void>(() => {
        switch (this._state) {
          case NgxPopupState.OPENED:
          case NgxPopupState.OPENING:
            const beforeClosePrevented: boolean = !this.dispatchEvent(new CustomEvent('beforeclose', {
              detail: detail,
              bubbles: false,
              cancelable: true
            }));

            if (beforeClosePrevented) {
              this._closePromise.reject(new Error(`Close prevented`));
            } else {
              if (this._state === NgxPopupState.OPENING) {
                this.dispatchEvent(new CustomEvent('cancelopen'));
                this._openPromise.reject(new Error(`Open cancelled`));
              }

              this._state = NgxPopupState.CLOSING;
              this._element.classList.remove('open');
              if (waitTransitionEnd) {
                this._waitTransitionEnd().then(() => {
                  if (this._closePromise !== null) {
                    this._closePromise.resolve();
                  }
                });
              } else {
                this._closePromise.resolve();
              }
            }
            break;
          default:
            this._closePromise.reject(new Error(`Popup not opened`));
            break;
        }
      });

      this._closePromise
        .then(() => {
          this._state = NgxPopupState.CLOSED;
          this._closePromise = null;
          this.dispatchEvent(new CustomEvent('close', {
            detail: detail
          }));
        }, () => {
          this._closePromise = null;
        });
    }

    return this._closePromise.promise;
  }


  @HostListener('click', ['$event'])
  onClickBackground(event: any) {
    if (this._backgroundClosable && (event.target === this._element)) {
      this.close(true, event);
    }
  }


  private _build(config: IPopupConfig) {
    config.inputs = config.inputs || {};
    config.inputs['popup'] = this;
    this._ngxDOMComponent = this._ngxDOMComponentContainer.create(config);
  }

  private _waitTransitionEnd(): Promise<any> {
    return new Promise((resolve: any) => {
      const transitionTime: number = this._getTransitionTime(this._element);
      if ((transitionTime === null) || (transitionTime > 10)) {
        setTimeout(resolve, transitionTime || 250);
        this.addEventListener('transitionend', resolve, { once: true });
      } else {
        resolve();
      }
    });
  }

  private _getTransitionTime(element: HTMLElement): number {
    const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);
    if (computedStyle.transitionDuration) {
      const timeReg: RegExp = new RegExp('([\\d\\.]+)((?:s)|(?:ms))', 'g');
      const timeMatch: RegExpExecArray | null = timeReg.exec(computedStyle.transitionDuration);
      if (timeMatch !== null) {
        const time: number = parseFloat(timeMatch[1]);
        switch (timeMatch[2]) {
          case 's':
            return time * 1000;
          case 'ms':
            return time;
        }
      }
    }
    return null;
  }
}