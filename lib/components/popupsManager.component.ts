import {
  Component, ElementRef, AfterViewInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { NgxDOMComponentContainer, NgxDOMComponent, NgxDOMComponentService } from 'ngx-dom-component';

import { NgxPopupComponent } from './popup.component';
import { IPopupConfig, NgxPopupService } from '../services/ngx-popup.service';

// <ngx-popup
// *ngFor="let popupId of popupIds;"
// (popupReady)="onPopupReady($event)"
// (popupClosed)="onPopupClosed($event)"
//   [popupId]="popupId"
//   ></ngx-popup>

@Component({
  selector: 'ngx-popups',
  template: `
   <ng-template #popupsContainer></ng-template>
  `
})
export class NgxPopupsManagerComponent implements AfterViewInit {

  @ViewChild('popupsContainer', { read: ViewContainerRef }) popupsContainer: ViewContainerRef;

  private popups: NgxDOMComponent[] = [];
  private element: HTMLElement;
  private ngxDOMComponentContainer: NgxDOMComponentContainer;

  constructor(private popupService: NgxPopupService,
              private ngxDOMComponentService: NgxDOMComponentService,
              element: ElementRef) {
    this.element = element.nativeElement;
    if(!this.element.id) this.element.id = 'popups-manager-' + Math.floor(Math.random() * 1e10).toString();
    this.popupService.registerManager(this.element.id, this);
    this.checkVisibility();
  }

  ngAfterViewInit() {
    this.ngxDOMComponentContainer = this.ngxDOMComponentService.createContainer(this.popupsContainer);
  }

  open(config?: IPopupConfig, waitTransitionEnd: boolean = true, detail?: any): Promise<NgxPopupComponent> {
    return new Promise((resolve: any, reject: any) => {
      let ngxDOMComponent: NgxDOMComponent = this.ngxDOMComponentContainer.create({
        componentType: NgxPopupComponent
      });
      this.popups.push(ngxDOMComponent);
      this.checkVisibility();

      let popup: NgxPopupComponent = ngxDOMComponent.instance;
      popup.addEventListener('ready', () => {
        resolve(
          popup.open(config, waitTransitionEnd).then(() => {
            return popup;
          })
        );
      }, { once: true });

      popup.addEventListener('close', () => {
        let index: number = this.popups.indexOf(ngxDOMComponent);
        if(index >= 0) {
          this.popups[index].destroy();
          this.popups.splice(index, 1);
          this.checkVisibility();
        }
      }, { once: true });
    });
  }

  close(popup: NgxPopupComponent, detail?: any) {
    return popup.close();
  }

  closeAll(): Promise<void> {
    let promises: any[] = [];
    let popups = this.popups.slice(0); // clone to avoid removing popups before finishing
    for(let popup of popups) {
      promises.push(popup.instance.close());
    }
    return Promise.all(promises).then(() => void 0);
  }

  private checkVisibility() {
    if(this.popups.length === 0) {
      this.element.classList.remove('visible');
    } else {
      this.element.classList.add('visible');
    }
  }

}
