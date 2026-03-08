import { withoutNullsOrUndefines } from "./arrays";
import { Listeners } from "./mount-dom";

export type CSSText = string; // e.g., 'color: red; font-family: Georgia;'

export type Attributes = { [key: string]: unknown } & {
  class?: string[] | string;
  style?: CSSText | Record<string, string>;
};

/**
 * @example
 * {
 *   class: 'header'
 *   on: {'click' : ()=> console.log('hello')}
 * }
 */
export type Props = Attributes & {
  on?: Record<string, EventListenerOrEventListenerObject>;
};

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
  props: Props;
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
  props: Props = {},
  children: (string | VNode | null)[] = [],
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
  nodes: (string | VNode | null)[],
): (VText | VNode | null)[] {
  return nodes.map((n) => (typeof n === "string" ? hString(n) : n));
}

export function hFragment(nodes: (string | VNode | null)[]): VFragment {
  return {
    type: VDOM_TYPES.FRAGMENT,
    children: withoutNullsOrUndefines(mapStringsToTextNodes(nodes)),
  };
}

export function extractChildren(vdom: VElement | VFragment): VNode[] {
  if (!vdom.children) return [];

  const children: VNode[] = [];

  for (const child of vdom.children) {
    if (child.type === "fragment") {
      children.push(...extractChildren(child));
    } else {
      children.push(child);
    }
  }

  return children;
}