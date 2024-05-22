import { VNode } from "./h";
import { removeEventListeners } from "./mount-dom";

export function destroyDOM(vdom: VNode) {
  if (vdom.el == null) {
    return;
  }

  switch (vdom.type) {
    case "text":
      vdom.el.remove();
      break;
    case "fragment":
      vdom.children.forEach(destroyDOM);
      break;
    case "element":
      vdom.children.forEach(destroyDOM);
      if (vdom.listeners) {
        removeEventListeners(vdom.listeners, vdom.el);
        delete vdom.listeners;
      }
      vdom.el.remove();
      break;
    default:
      throw Error("unknown type - can't be destroyed");
  }
}
