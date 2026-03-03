import { VDOM_TYPES, VElement, VNode } from "./h";

export function areNodesEqual(first: VNode, second: VNode): boolean {
  if (first.type !== second.type) {
    return false;
  }

  if (first.type === VDOM_TYPES.ELEMENT) {
    return first.tag === (second as VElement).tag;
  }

  return true;
}
