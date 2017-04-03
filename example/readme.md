```ts
import { Component, Input } from '@angular/core';
import { NgxPopupComponent, NgxPopupService } from 'ngx-popups';


@Component({
  moduleId: module.id,
  selector: 'my-component',
  template: `
    <div (click)="popup.close()">close</div>
    <p>Message : {{ message }}</p>
  `
})
export class MyComponent {
  @Input() popup;
  @Input() message;
}

@Component({
  moduleId: module.id,
  selector: 'home'
})
export class AboutComponent {
  constructor(private popupService: NgxPopupService) {}

  simpleOpen() {
    this.popupService.open({
      componentType: MyComponent,
      inputs: {
        message: 'Opening'
      }
    }).then((popup: NgxPopupComponent) => {
      popup.contentInstance.message = 'Opened';
      popup.element.classList.add('my-component-popup');

      popup.addEventListener('close', () => {
        console.log('Popup is closed');
      }, { once: true })
    }).catch(() => {
      console.warn('Popup opening has been cancelled');
    });
  }

  openMany() {
    for(let i = 0; i < 10; i++) {
      this.popupService.open({
        componentType: MyComponent,
        inputs: {
          message: '#' + i
        }
      });
    }

    setTimeout(() => {
      this.popupService.closeAll();
    }, 3000);
  }

  openBackgroundNotClosable() {
    this.popupService.open({
      componentType: MyComponent,
      inputs: {
        message: 'Background Not Closable'
      }
    }, false).then((popup: NgxPopupComponent) => {
      popup.backgroundClosable = false;

      // EQUIVALENT :

      // popup.addEventListener('beforeclose', (event: CustomEvent) => {
      //   if(event.detail && event.detail.target === popup.element) {
      //     event.preventDefault();
      //   }
      // });
    });
  }
}
```
