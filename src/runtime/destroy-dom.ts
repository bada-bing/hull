import { VNode } from "./h";
import { removeEventListeners } from "./mount-dom";

export function destroyDOM(vdom: VNode) {
  if (vdom.el == null) {
    return;
  }

  switch (vdom.type) {
    case "text":
      vdom.el.remove();
      delete vdom.el;
      break;
    case "fragment":
      vdom.children.forEach(destroyDOM);
      delete vdom.el;
      break;
    case "element":
      vdom.children.forEach(destroyDOM);
      if (vdom.listeners) {
        removeEventListeners(vdom.listeners, vdom.el);
        delete vdom.listeners;
      }
      vdom.el.remove();
      delete vdom.el;
      break;
    default:
      const _exhaustive: never = vdom;
      throw Error(`Unhandled vdom type: ${_exhaustive}`);
  }
}
