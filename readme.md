[![npm version](https://badge.fury.io/js/ngx-popups.svg)](https://www.npmjs.com/package/ngx-popups)

[![NPM](https://nodei.co/npm/ngx-popups.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/ngx-popups/)

# ngx-popups

Popups for angular 4+ : load dynamically your components into a popup. Minimal style and html for easy personalization.
This library use [ngx-dom-component](https://github.com/lifaon74/ngx-dom-component). Moreover to be compatible with internet explorer and edge you could be interested to use [events-polyfill](https://github.com/lifaon74/events-polyfill), because ngx-popups use 'once' property of addEventListener.

See [example/](./example) if needed.

## Install
```
npm install --save ngx-popups ngx-dom-component events-polyfill
```
```ts
@NgModule({
    providers: [NgxPopupModule],
    declarations: [ /* Put here your components to be injected */ ],
    entryComponents: [ /* Put here your components to be injected */  ],
})
export class AppModule { }
```
And put `<ngx-popups></ngx-popups>` into your main component template.

Into your SystemJs config you'll need to put :
```ts
packages: {
    'ngx-popups', {
		main: 'path_to/ngx-popups.js',
		defaultExtension: 'js'
	},
	'ngx-dom-component', {
		main: 'path_to/ngx-dom-component.js',
		defaultExtension: 'js'
	}
}
```
## Style (scss or css)
This package comes with a minimal style that you can include with :
```scss
@include 'node_modules/ngx-popups/style';
```
or
```html
<link rel="stylesheet" type="text/css" href="/node_modules/ngx-popups/style.css">
```


## Documentation
### NgxPopupService
**open**
```ts
open(config: IPopupConfig, waitTransitionEnd: boolean = true, detail?: any, managerId?: string): Promise<NgxPopupComponent>
```
Opens a new popup and inject a component inside. Returns a promise resolved when the popup is opened.

`config` :
```ts
{
    componentType: any; // the component to inject
    inputs?: { [key: string]: any; }; // the inputs to pass to the component
    outputs?: { [key: string]: Function;}; // the outputs to listen to the component
}
```
`waitTransitionEnd` (default true) : if true wait the end of the animation before triggering open/resolving promise.
`detail` : provide data to the `detail` property of the custom event `open`.
`managerId` : in case of many managers, you can provide a specific manager id.

**close**
```ts
close(popup: NgxPopupComponent, waitTransitionEnd: boolean = true, detail?: any): Promise<void>;
```
Closes a popup. Returns a promise resolved when the popup is closed.

**closeAll**
```ts
closeAll(managerId?: string): Promise<void>;
```
Closes all popups. Returns a promise resolved when all popups are closed.

### NgxPopupComponent
**close**
```ts
close(waitTransitionEnd: boolean = true, detail?: any): Promise<void>
```
Closes the popup. Returns a promise resolved when the popup is closed.

**contentInstance**
```ts
 readonly contentInstance: any;
```
Returns the instance of the injected component.

**element**
```ts
readonly element: HTMLElement;
```
Returns the DOM element of the popup (can be use to add class, etc...).

**closable**
```ts
get/set closable: boolean;
```
Allow/Disallow close for the popup.

**backgroundClosable**
```ts
get/set backgroundClosable: boolean;
```
Allow/Disallow close for the popup when clicking on the background.

**EventTarget**
The NgxPopupComponent inherits of all methods of EventTarget. It includes :
- addEventListener
- dispatchEvent
- removeEventListener

The following events are available :
- **close** : after the popup is closed (including transition or not, according to 'waitTransitionEnd').
- **beforeclose** : when the close method is called. Use event.preventDefault() to cancel close.
- **cancelopen** : when an open is cancelled (ex: while animating, the popup is in a 'opening' state, if you call close before animation is complete, it cancels the open).

All of them are `CustomEvent`, with a `detail` property that you can set when calling `open` or `close`.


