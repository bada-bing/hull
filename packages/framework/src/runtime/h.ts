import { withoutNullsOrUndefines } from "./arrays";
import { Listeners } from "./mount-dom";

// types of Virtual Nodes
export const VDOM_TYPES = {
  TEXT: "text",
  ELEMENT: "element",
  FRAGMENT: "fragment",
} as const;

export interface VElement {
  el?: HTMLElement;
  listeners?: Listeners;
  tag: string;
  props: {};
  children: VNode[];
  type: (typeof VDOM_TYPES)["ELEMENT"];
}

export interface VText {
  el?: Text;
  type: (typeof VDOM_TYPES)["TEXT"];
  value: string;
}

export interface VFragment {
  el?: HTMLElement;
  type: (typeof VDOM_TYPES)["FRAGMENT"];
  children: VNode[];
}

export type VNode = VElement | VText | VFragment;

/**
 *
 * Create a `virtual DOM element` node.
 *
 * h is short for hyperscript, a script that creates hypertext
 *
 * Produces a VElement representing an element of the given tag.
 * String children are converted to text-node VElements and null children are filtered out.
 *
 * This function serves a similar purpose as HTML markup,
 * and that is to create a structure which can be used to generate DOM
 *
 * @param tag - The element tag name (e.g. "div", "span") or a custom element identifier.
 * @param props - A plain object of element properties and attributes to attach to the element.
 *                This typically includes DOM attributes, element-specific properties,
 *                style objects, dataset entries, and event handler functions.
 * @param children - An array of child nodes, each of which may be a string (will be converted
 *                   to a text node), a VElement, or null. Null entries are removed (default: `[]`).
 */
export function h(
  tag: string,
  props = {},
  children: (string | VElement | null)[] = [],
): VElement {
  return {
    type: VDOM_TYPES.ELEMENT,
    tag,
    props,
    children: withoutNullsOrUndefines(mapStringsToTextNodes(children)),
  };
}

export function hString(text: string): VText {
  return {
    type: VDOM_TYPES.TEXT,
    value: text,
  };
}

export function mapStringsToTextNodes(
  nodes: (string | VElement | null)[],
): (VText | VElement | null)[] {
  return nodes.map((n) => (typeof n === "string" ? hString(n) : n));
}

export function hFragment(nodes: (string | VElement | null)[]): VFragment {
  return {
    type: VDOM_TYPES.FRAGMENT,
    children: withoutNullsOrUndefines(mapStringsToTextNodes(nodes)),
  };
}
