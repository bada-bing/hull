import { Attributes, Props, VElement, VFragment, VNode, VText } from "./h";
import { addEventListener, Listeners } from "./event-listeners";

export function insert(
  el: HTMLElement | Text,
  parent: HTMLElement,
  index?: number | null,
): void {
  if (index == null || index == undefined) {
    parent.append(el);
    return;
  }

  if (index < 0)
    throw new Error(`Index must be a positive integer, got ${index}`);

  if (index >= parent.childNodes.length) {
    parent.append(el);
  } else {
    parent.insertBefore(el, parent.childNodes[index]);
  }
}

export function mountDOM(vdom: VNode, parentEl: HTMLElement, index?: number | null) {
  switch (vdom.type) {
    case "text":
      createTextNode(vdom, parentEl, index);
      break;
    case "element":
      createElementNode(vdom, parentEl, index);
      break;
    case "fragment":
      createFragmentNode(vdom, parentEl, index);
      break;
    default:
      // exhaustiveness checking ensures that all vdom.type options are covered
      const _exhaustive: never = vdom;
      throw new Error(`Unhandled vdom type: ${_exhaustive}`);
  }
}

function createTextNode(vdom: VText, parentEl: HTMLElement, index?: number | null) {
  const textNode = document.createTextNode(vdom.value);
  vdom.el = textNode;

  insert(vdom.el, parentEl, index);
}

function createElementNode(
  vEl: VElement,
  parentEl: HTMLElement,
  index?: number | null,
) {
  const el = document.createElement(vEl.tag);

  addProps(el, vEl.props, vEl);

  vEl.children.forEach((c) => mountDOM(c, el));

  vEl.el = el;

  insert(vEl.el, parentEl, index);
}

function createFragmentNode(
  vdom: VFragment,
  parentEl: HTMLElement,
  index?: number | null,
) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/createDocumentFragment
  vdom.el = parentEl;

  // each child has offset

  vdom.children.forEach((child, offset) =>
    mountDOM(
      child,
      parentEl,
      index !== null && index !== undefined ? index + offset : undefined,
    ),
  );
}

function addProps(domel: HTMLElement, props: Props, vdom: VElement) {
  const { on: listeners, ...attrs } = props;
  if (listeners) {
    vdom.listeners = addEventListeners(listeners, domel);
  }
  setAttributes(attrs, domel);
}

export function addEventListeners(
  listeners: Listeners,
  domel: EventTarget,
): Listeners {
  const addedEventListeners: Listeners = {};

  Object.entries(listeners).forEach(([type, handler]) => {
    const registeredHandler = addEventListener(type, handler, domel);
    addedEventListeners[type] = registeredHandler;
  });
  return addedEventListeners;
}

export function removeEventListeners(listeners: Listeners, domel: EventTarget) {
  Object.entries(listeners).forEach(([type, handler]) => {
    domel.removeEventListener(type, handler);
  });
}

// TODO move to attributes.ts (and refactor)
function setAttributes(attributes: Attributes, domel: HTMLElement): void {
  const { class: classList, style, ...otherAttributes } = attributes;

  if (classList) {
    if (Array.isArray(classList)) {
      domel.classList.add(...classList);
    } else {
      domel.className = classList;
    }
  }

  if (style) {
    if (typeof style === "string") {
      domel.style.cssText = style;
    } else {
      // @ts-expect-error
      Object.entries(style).forEach(([key, val]) => (domel.style[key] = val));
    }
  }

  // set all other attributes
  Object.entries(otherAttributes as Omit<Attributes, "style" | "class">).forEach(([key, value]) => {
    if (value == null) {
      // @ts-expect-error
      domel[key] = null;
      domel.removeAttribute(key);
    } else {
      // @ts-expect-error
      domel[key] = value;
      domel.setAttribute(key, value as string);
    }
  });
}
