import {
  Component, ViewContainerRef, ViewChild, ElementRef, AfterViewInit, HostListener, OnDestroy
} from '@angular/core';
import { NgxDOMComponent, NgxDOMComponentContainer, NgxDOMComponentService } from 'ngx-dom-component';
import { IPopupConfig } from '../services/ngx-popup.service';
import { DeferredPromise } from '../classes/DeferredPromise';


export enum NgxPopupState {
  CLOSED,
  CLOSING,
  OPENED,
  OPENING
}

@Component({
  selector: 'ngx-popup',
  template: `
   <div class="content">
    <ng-template #contentContainer></ng-template>
   </div>
  `
})
export class NgxPopupComponent implements AfterViewInit, OnDestroy {

  @ViewChild('contentContainer', { read: ViewContainerRef }) contentContainer: ViewContainerRef;

  public closable: boolean            = true;
  public backgroundClosable: boolean  = true;

  public _element: HTMLElement;
  public ngxDOMComponentContainer: NgxDOMComponentContainer;
  public ngxDOMComponent: NgxDOMComponent;
  public state: NgxPopupState = NgxPopupState.CLOSED;

  private openPromise: DeferredPromise<void>;
  private closePromise: DeferredPromise<void>;

  private closableListener: any;

  constructor(
    private ngxDOMComponentService: NgxDOMComponentService,
    element: ElementRef
  ) {
    this._element = element.nativeElement;

    this.closableListener = (event: Event) => {
      if(!this.closable) event.preventDefault();
    };

    this.addEventListener('beforeclose',  this.closableListener);
  }

  /**
   * Returns the instance of the injected component.
   */
  get contentInstance(): any {
    return this.ngxDOMComponent.instance;
  }

  /**
   * Returns the DOM element of the popup
   * @returns {HTMLElement}
   */
  get element(): HTMLElement {
    return this._element;
  }


  ngAfterViewInit() {
    this.ngxDOMComponentContainer = this.ngxDOMComponentService.createContainer(this.contentContainer);
    requestAnimationFrame(() => { // allows css to apply without the class 'open'
      this.dispatchEvent(new CustomEvent('ready'));
    });
  }

  ngOnDestroy() {
    this.removeEventListener('beforeclose',  this.closableListener);
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
    if(!this.openPromise) {
      this.openPromise = new DeferredPromise<void>(() => {
        switch(this.state) {
          case NgxPopupState.CLOSED:
          case NgxPopupState.CLOSING:
            if(!this.dispatchEvent(new CustomEvent('beforeopen', {
                detail: detail,
                bubbles: false,
                cancelable: true
              }))) {
              this.openPromise.reject(new Error('Open prevented'));
            } else {
              if(this.state === NgxPopupState.CLOSING) {
                this.dispatchEvent(new CustomEvent('cancelclose'));
                this.closePromise.reject(new Error('Close cancelled'));
              }

              this.state = NgxPopupState.OPENING;
              this.build(config);

              requestAnimationFrame(() => { // allows content to be rendered before adding 'open'
                this._element.classList.add('open');
                if(waitTransitionEnd) {
                  this.waitTransitionEnd().then(() => {
                    if(this.openPromise) this.openPromise.resolve();
                  });
                } else {
                  this.openPromise.resolve();
                }
              });
            }
            break;
          default:
            this.openPromise.reject(new Error('Popup not closed'));
            break;
        }
      });

      this.openPromise
      .then(() => {
        this.state = NgxPopupState.OPENED;
        this.openPromise = null;
        this.dispatchEvent(new CustomEvent('open', {
          detail: detail
        }));
      }).catch(() => {
        this.openPromise = null;
      });
    }

    return this.openPromise.promise;
  }

  /**
   * Close the popup.
   *
   * @param waitTransitionEnd
   * @param detail
   * @returns {Promise<void>} - promise resolved when the popup is closed
   */
  close(waitTransitionEnd: boolean = true, detail?: any): Promise<void> {
    if(!this.closePromise) {
      this.closePromise = new DeferredPromise<void>(() => {
        switch(this.state) {
          case NgxPopupState.OPENED:
          case NgxPopupState.OPENING:
            if(!this.dispatchEvent(new CustomEvent('beforeclose', {
                detail: detail,
                bubbles: false,
                cancelable: true
              }))) {
              this.closePromise.reject(new Error('Close prevented'));
            } else {
              if(this.state === NgxPopupState.OPENING) {
                this.dispatchEvent(new CustomEvent('cancelopen'));
                this.openPromise.reject(new Error('Open cancelled'));
              }

              this.state = NgxPopupState.CLOSING;
              this._element.classList.remove('open');
              if(waitTransitionEnd) {
                this.waitTransitionEnd().then(() => {
                  if(this.closePromise) this.closePromise.resolve();
                });
              } else {
                this.closePromise.resolve();
              }
            }
            break;
          default:
            this.closePromise.reject(new Error('Popup not opened'));
            break;
        }
      });

      this.closePromise
      .then(() => {
        this.state = NgxPopupState.CLOSED;
        this.closePromise = null;
        this.dispatchEvent(new CustomEvent('close', {
          detail: detail
        }));
      }).catch(() => {
        this.closePromise = null;
      });
    }

    return this.closePromise.promise;
  }


  @HostListener('click', ['$event']) onClickBackground(event: any) {
    if(this.backgroundClosable && (event.target === this._element)) this.close(true, event);
  }

  private build(config: IPopupConfig) {
    config.inputs = config.inputs || {};
    config.inputs['popup'] = this;
    this.ngxDOMComponent = this.ngxDOMComponentContainer.create(config);
  }

  private waitTransitionEnd(): Promise<any> {
    return new Promise((resolve: any) => {
      let transitionTime: number = this.getTransitionTime(this._element);
      if((transitionTime === null) || (transitionTime > 10)) {
        setTimeout(resolve, transitionTime || 250);
        this.addEventListener('transitionend', resolve, { once: true });
      } else {
        resolve();
      }
    });
  }

  private getTransitionTime(element: HTMLElement): number {
    const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);
    if(computedStyle.transitionDuration) {
      const timeReg = new RegExp('([\\d\\.]+)((?:s)|(?:ms))', 'g');
      const timeMatch = timeReg.exec(computedStyle.transitionDuration);
      if(timeMatch) {
        const time: number = parseFloat(timeMatch[1]);
        switch(timeMatch[2]) {
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