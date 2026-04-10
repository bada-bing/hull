import { GenericComponentInstance } from "./component";

export type Listeners = Record<string, EventListenerOrEventListenerObject>;

// TODO Test the new bounded handler! also, do I have special tests for event listeners which are now in its own module 
export function addEventListener(
  eventType: string,
  handler: EventListenerOrEventListenerObject,
  domTarget: EventTarget,
  hostComponent: GenericComponentInstance | null = null,
) {  
  // bound the handler to the hostComponent if possible
  const boundedListener: EventListener = (evt: Event) => {
    hostComponent
      ? (handler as EventListener).apply(hostComponent, [evt])
      : (handler as EventListener)(evt);
  };

  domTarget.addEventListener(eventType, boundedListener);

  return boundedListener;
}