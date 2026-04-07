export type Listeners = Record<string, EventListenerOrEventListenerObject>;

export function addEventListener(
  eventType: string,
  handler: EventListenerOrEventListenerObject,
  domTarget: EventTarget,
) {
  domTarget.addEventListener(eventType, handler);
  return handler;
}