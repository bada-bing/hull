import { objectsDiff } from "../utils/objects";
import { arraysDiff, arraysDiffSequence } from "./arrays";
import { cssTextToRecord, removeAttribute, setAttribute } from "./attributes";
import { GenericComponentInstance } from "./component";
import { destroyDOM } from "./destroy-dom";
import { extractChildren, VDOM_TYPES, VElement, VFragment, VNode } from "./h";
import { mountDOM } from "./mount-dom";
import { Listeners } from "./event-listeners";
import { areNodesEqual } from "./nodes-equal";


export function patchDOM<T extends VNode, C extends GenericComponentInstance>(
  oldNode: VNode,
  newNode: T,
  parentEl: HTMLElement,
  hostComponent: C | null = null
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
      // TODO This is the only place where we add component (because of the offset)
      // do we need to pass the whole component (wait until you finish the book and improve)
      if (oldNode.type === "fragment" && newNode.type === "fragment") {
        patchChildren(oldNode, newNode, hostComponent);
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

// todo what is the relation between hostComponent and vdom? is it the same in case of Elements? in case of fragments?
// host component `owns` the related vdom (vdom is like a snapshot, and component is a persistent, stateful object)
function patchChildren<T extends VFragment | VElement, C extends GenericComponentInstance>(oldVdom: T, newVdom: T, hostComponent: C | null = null) {

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
    const offset = hostComponent?.offset ?? 0; //use to find actual position of DOM nodes (not relevant for vdom)

    switch (operation) {
      case "add": {
        mountDOM(item as VNode, parentEl!, diff.index+offset);
        break;
      }

      case "remove": {
        destroyDOM(item as VNode);
        break;
      }

      case "move": {
        // TODO difference between originalIndex and from, and do I need both?
        const child = oldChildren[diff.originalIndex]; // i.e., original position of the child
        const nodeAtTargetPosition = parentEl?.childNodes[diff.index+offset]; // i.e., target position

        parentEl?.insertBefore(child.el!, nodeAtTargetPosition!);

        const newChild = newChildren[diff.index];
        patchDOM(child, newChild, parentEl!, hostComponent);

        break;
      }

      case "noop": {
        patchDOM(oldChildren[diff.originalIndex], newChildren[diff.index], parentEl!, hostComponent)
        break;
      }
    }
  }
}
/**
 * 
// data attributes in an element are accessed by element.dataset
// all other attributes (i.e., corresponding properties) are accessed by element[attribute]
// getAttribute() works for both data-attributes and regular HTML attributes (e.g., id)

// important: The relationship between an HTML attribute and a DOM property varies depending on the attribute:
// - Initial vs. Current Value: For form elements (`value`, `checked`), the attribute sets the initial value while the property holds the current live value.
// - Direct Reflection: For many attributes (`id`, `class`), the property is a direct reflection of the attribute, and they stay in sync.
// - Resolved vs. Literal Value: For attributes like `href`, the attribute is the literal string, while the property is the browser's full, resolved URL.

// therefore an (HTML) attribute and a (DOM) property do not necessarily have the same value always
// e.g., for input element and value attribute/property element['value'] is not necessarily equal to element.getAttribute('value')
// element.getAttribute('value') will return the initial value when creating the DOM el (out of HTML markup)  

// Why are JS objects of type HTMLElement (and not DOM Element)?
// the DOM part is implied, since the entire API is the DOM API! all HTMLElements are also of type Node (DOM Node)
// HTMLElement are just nodes which were created by interpreting HTML markup

// more precisely HTMLElements extend the type Element (which extend the type Node) which are language neutral element nodes in the DOM
// other than HTMLElement, a prominent type is SVGElement
// also if you would to load XML into the browser, it would be represented with generic Element type

A DOM element is what's known as a Host Object, not a native JavaScript object.
* A native object is one defined by the JavaScript specification, like Object, Array, or Date. Your code creates them ({} or new Array()), and they are managed entirely within the JavaScript engine's heap.
* A host object is one provided by the environment outside of JavaScript—in this case, the browser. window, document, and all DOM elements (HTMLDivElement, etc.) are host objects.
* As such, hosted objects have a special lifecycle and the context (i.e., this) tied to the DOM
 */

/**
 * DFS and Recursion
 * The patchDOM function calls patchChildren, which then calls patchDOM on the children of the node it's currently processing. This creates a recursive loop that continues until it reaches a node
     with no children (a leaf node).

* Depth-First Search (DFS): This recursive process is a classic example of a depth-first search. The algorithm effectively says:
    1. "Patch the current node."
    2. "Now, go to my first child and repeat the whole process (patch it, then go to its children)."
    3. "Only after you have completely finished with that child's entire branch, come back up and start the process for my next child."
       
* The call stack of the JavaScript engine keeps track of the path down the tree. As patchDOM is called on nested children, the call stack grows. When a branch is fully patched, the functions return, the stack
  unwinds, and the algorithm proceeds to the next sibling node.

 */
