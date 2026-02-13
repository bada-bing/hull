import { VElement, VFragment, VNode, VText } from "./h";

export function mountDOM(vdom: VNode, parentEl: HTMLElement) {
  switch (vdom.type) {
    case "text":
      createTextNode(vdom, parentEl);
      break;
    case "element":
      createElementNode(vdom, parentEl);
      break;
    case "fragment":
      createFragmentNode(vdom, parentEl);
      break;
    default:
      // exhaustiveness checking ensures that all vdom.type options are covered
      const _exhaustive: never = vdom;
      throw new Error(`Unhandled vdom type: ${_exhaustive}`);
  }
}

function createTextNode(vdom: VText, parentEl: HTMLElement) {
  const textNode = document.createTextNode(vdom.value);
  vdom.el = textNode;

  parentEl.append(textNode);
}

function createElementNode(vEl: VElement, parentEl: HTMLElement) {
  const el = document.createElement(vEl.tag);

  addProps(el, vEl.props, vEl);

  vEl.children.forEach((c) => mountDOM(c, el));

  vEl.el = el;

  parentEl.appendChild(el);
}

function createFragmentNode(vdom: VFragment, parentEl: HTMLElement) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/createDocumentFragment
  vdom.el = parentEl;
  vdom.children.forEach((child) => mountDOM(child, parentEl));
}

type Attributes = Record<string, string> & {
  classList?: string[] | string;
  style?: CSSText | Record<string, string>;
};

/**
 * @example
 * {
 *   class: 'header'
 *   on: {'click' : ()=> console.log('hello')}
 * }
 */
type Props = Attributes & {
  on?: Record<string, EventListenerOrEventListenerObject>;
};

function addProps(domel: HTMLElement, props: Props, vdom: VElement) {
  const { on: listeners, ...attrs } = props;
  if (listeners) {
    (vdom as any).listeners = addEventListeners(listeners, domel);
  }
  setAttributes(attrs, domel);
}

export type Listeners = Record<string, EventListenerOrEventListenerObject>;

function addEventListeners(
  listeners: Listeners,
  domel: EventTarget,
): Listeners {
  const addedEventListeners: Listeners = {};

  Object.entries(listeners).forEach(([type, handler]) => {
    domel.addEventListener(type, handler);
    addedEventListeners[type] = handler;
  });
  return addedEventListeners;
}

export function removeEventListeners(listeners: Listeners, domel: EventTarget) {
  Object.entries(listeners).forEach(([type, handler]) => {
    domel.removeEventListener(type, handler);
  });
}

type CSSText = string; // e.g., 'color: red; font-family: Georgia;'

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
      Object.entries(style).forEach(([key, val]) => (domel.style[key] = val));
    }
  }

  // set all other attributes
  Object.entries(otherAttributes).forEach(([key, value]) => {
    if (value == null) {
      domel[key] = null;
      domel.removeAttribute(key);
    } else {
      domel[key] = value;
      domel.setAttribute(key, value);
    }
  });
}
