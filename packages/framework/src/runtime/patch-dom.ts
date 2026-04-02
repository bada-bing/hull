import { objectsDiff } from "../utils/objects";
import { arraysDiff, arraysDiffSequence } from "./arrays";
import { cssTextToRecord, removeAttribute, setAttribute } from "./attributes";
import { destroyDOM } from "./destroy-dom";
import { extractChildren, VDOM_TYPES, VElement, VFragment, VNode } from "./h";
import { Listeners, mountDOM, addEventListeners } from "./mount-dom";
import { areNodesEqual } from "./nodes-equal";

export function patchDOM<T extends VNode>(
  oldNode: VNode,
  newNode: T,
  parentEl: HTMLElement,
): T {
  // if nodes are not equal, we replace whole subtree (node and its children)
  if (!areNodesEqual(oldNode, newNode)) {
    const idx =
      oldNode.el !== null && oldNode.el !== undefined
        ? findIndexInParent(parentEl, oldNode.el)
        : null;
    destroyDOM(oldNode);

    mountDOM(newNode, parentEl, idx);
    return newNode;
  }

  // from this point onwards function modifies nodes, instead of replacing them

  // start by assigning the DOM node (i.e., `el`) to the new (virtual) node
  newNode.el = oldNode.el;

  switch (oldNode.type) {
    case VDOM_TYPES.TEXT: {
      if (
        oldNode.type === VDOM_TYPES.TEXT &&
        newNode.type === VDOM_TYPES.TEXT
      ) {
        if (!oldNode.el) throw new Error("old text node in DOM is undefined");

        patchText(oldNode.el, newNode.value);
        return newNode;
      }
    }

    case VDOM_TYPES.ELEMENT: {
      if (
        oldNode.type === VDOM_TYPES.ELEMENT &&
        newNode.type === VDOM_TYPES.ELEMENT
      ) {
        patchElement(oldNode, newNode);
        patchChildren(oldNode, newNode);
      }
      break;
    }

    case "fragment": {
      if (oldNode.type === "fragment" && newNode.type === "fragment") {
        patchChildren(oldNode, newNode);
      }
      break;
    }
  }

  return newNode;
}

export function findIndexInParent(
  parentEl: HTMLElement,
  node: ChildNode,
): number | null {
  const children = Array.from(parentEl.childNodes);
  const idx = children.indexOf(node);
  if (children.indexOf(node) < 0) {
    return null;
  } else return idx;
}

function patchText(textNode: Text, newValue: string) {
  if (textNode.nodeValue !== newValue) textNode.nodeValue = newValue;
}

function patchElement(oldElement: VElement, newElement: VElement) {
  const {
    class: oldClasses,
    style: oldStyle,
    on: oldEventListeners,
    ...oldAttributes
  } = oldElement.props;
  const {
    class: newClasses,
    style: newStyle,
    on: newEventListeners,
    ...newAttributes
  } = newElement.props;
  const oldAttachedListeners = oldElement.listeners;

  if (!newElement.el) {
    throw new Error(
      `patching the unmounted element node results in failure. element: ${newElement.tag}`,
    );
  }

  patchAttributes(newElement.el, oldAttributes, newAttributes);
  patchClasses(newElement.el, oldClasses, newClasses);
  patchStyle(newElement.el, oldStyle, newStyle);
  newElement.listeners = patchEventListeners(
    newElement.el,
    oldEventListeners,
    oldAttachedListeners,
    newEventListeners,
  );
}

function patchEventListeners(
  el: HTMLElement,
  oldListeners: Record<string, EventListenerOrEventListenerObject> = {},
  attachedListeners: Listeners = {},
  newListeners: Record<string, EventListenerOrEventListenerObject> = {},
): Record<string, EventListenerOrEventListenerObject> {
  const { added, updated, removed } = objectsDiff(oldListeners, newListeners);

  for (const event of removed.concat(updated)) {
    el.removeEventListener(event, attachedListeners[event]);
  }

  const addedListeners: Record<string, EventListenerOrEventListenerObject> = {};

  for (const event of updated.concat(added)) {
    el.addEventListener(event, newListeners[event]);
    addedListeners[event] = newListeners[event];
  }

  return addedListeners;
}

function patchAttributes(
  element: HTMLElement,
  oldAttributes: Record<string, unknown>,
  newAttributes: Record<string, unknown>,
): void {
  const { added, removed, updated } = objectsDiff(oldAttributes, newAttributes);

  for (const attr of removed) removeAttribute(attr, element);

  for (const attr of added.concat(updated))
    setAttribute(attr, element, newAttributes[attr] as string | number | null);
}

function patchClasses(
  el: HTMLElement,
  oldClasses: string | string[] | undefined,
  newClasses: string | string[] | undefined,
) {
  const { removed, added } = arraysDiff(
    toClassList(oldClasses),
    toClassList(newClasses),
  );

  el.classList.remove(...removed);
  el.classList.add(...added);

  if (el.classList.length === 0) {
    // remove the HTML attribute - otherwise it remains in the HTML as `class=""`
    el.removeAttribute("class");
  }
}

function toClassList(oldClassList: string | string[] | undefined): string[] {
  function isNotBlankOrEmptyString(value: string): value is string {
    return value.trim() !== "";
  }

  if (!oldClassList) {
    return new Array();
  } else if (Array.isArray(oldClassList)) {
    return oldClassList.filter(isNotBlankOrEmptyString);
  } else {
    // the textbook uses classes.split(/(\s+)/) - why does it need capturing group
    return oldClassList.split(/\s+/).filter(isNotBlankOrEmptyString);
  }
}

function toStyleRecord(
  style: string | Record<string, string> | undefined,
): Record<string, string> {
  return typeof style === "object" ? style : cssTextToRecord(style);
}

function patchStyle(
  el: HTMLElement,
  oldStyle: string | Record<string, string> | undefined,
  newStyle: string | Record<string, string> | undefined,
) {
  const oldStyleObj = toStyleRecord(oldStyle);
  const newStyleObj = toStyleRecord(newStyle);
  const { added, removed, updated } = objectsDiff(oldStyleObj, newStyleObj);

  for (const key of removed) {
    // @ts-expect-error
    el.style[key] = "";
  }

  for (const key of added.concat(updated)) {
    // @ts-expect-error
    el.style[key] = newStyleObj[key];
  }
}

function patchChildren<T extends VFragment | VElement>(oldVdom: T, newVdom: T) {
  const oldChildren = extractChildren(oldVdom);
  const newChildren = extractChildren(newVdom);
  const parentEl = oldVdom.el;

  const diffSequence = arraysDiffSequence(
    oldChildren,
    newChildren,
    areNodesEqual,
  );

  for (const diff of diffSequence) {
    const { operation, item } = diff;

    switch (operation) {
      case "add": {
        mountDOM(item as VNode, parentEl!, diff.index);
        break;
      }

      case "remove": {
        destroyDOM(item as VNode);
        break;
      }

      case "move": {
        const child = oldChildren[diff.originalIndex]; // i.e., original position of the child
        const nodeAtTargetPosition = parentEl?.childNodes[diff.index];

        parentEl?.insertBefore(child.el!, nodeAtTargetPosition!);

        const newChild = newChildren[diff.index];
        patchDOM(child, newChild, parentEl!);

        break;
      }

      case "noop": {
        patchDOM(
          oldChildren[diff.originalIndex],
          newChildren[diff.index],
          parentEl!,
        );
        break;
      }
    }
  }
}
