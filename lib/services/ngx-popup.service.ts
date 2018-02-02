import { Injectable } from '@angular/core';
import { NgxPopupComponent } from '../components/popup.component';
import { NgxPopupsManagerComponent } from '../components/popupsManager.component';
import { NgxDOMComponentOptions } from 'ngx-dom-component';


export interface IPopupConfig extends NgxDOMComponentOptions { }

@Injectable()
export class NgxPopupService {

  private managers: Map<string, NgxPopupsManagerComponent> = new Map<string, NgxPopupsManagerComponent>();

  constructor() { }

  registerManager(id: string, manager: NgxPopupsManagerComponent) {
    if (this.managers.get(id)) {
      throw new Error(`Duplicate manager id: ${id}`);
    }

    this.managers.set(id, manager);
  }

  /**
   * Opens a new popup and inject a component inside.
   *
   * @param config - config of the component to inject
   * @param waitTransitionEnd - (default true) if true wait the end of the animation before triggering open/resolving promise.
   * @param detail - provide data to the 'detail' property of the custom event 'open'
   * @param managerId - in case of many managers, you can provide a specific manager id
   * @returns {Promise<NgxPopupComponent>} - promise resolved when the popup is opened
   */
  open(config: IPopupConfig, waitTransitionEnd: boolean = true, detail?: any, managerId?: string): Promise<NgxPopupComponent> {
    return this.getManager(managerId).open(config, waitTransitionEnd, detail);
  }

  /**
   * Closes a popup.
   *
   * @param popup - the popup to close
   * @param waitTransitionEnd - (default true) if true wait the end of the animation before triggering open/resolving promise.
   * @param detail - provide data to the 'detail' property of the custom event 'open'
   * @returns {Promise<void>} - promise resolved when the popup is closed
   */
  close(popup: NgxPopupComponent, waitTransitionEnd: boolean = true, detail?: any): Promise<void> {
    return popup.close(waitTransitionEnd, detail);
  }

  /**
   * Closes all popups.
   *
   * @param managerId
   * @returns {Promise<void>} - promise resolved when all popups are closed.
   */
  closeAll(managerId?: string): Promise<void> {
    return this.getManager(managerId).closeAll();
  }


  protected getManager(id?: string): NgxPopupsManagerComponent {
    let manager: NgxPopupsManagerComponent;
    if (id === void 0) {
      if (this.managers.size > 0) {
        manager = this.managers.values().next().value;
      } else {
        throw new Error(`No manager for PopupService`);
      }
    } else if (typeof id === 'string') {
      manager = this.managers.get(id);
      if (manager === void 0) {
        throw new Error(`Invalid manager id: ${id}`);
      }
    } else {
      throw new TypeError(`Expected string or undefined as id`);
    }
    return manager;
  }

}
