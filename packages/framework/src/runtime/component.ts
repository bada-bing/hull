import { destroyDOM } from "./destroy-dom";
import { extractChildren, VNode } from "./h";
import { mountDOM } from "./mount-dom";
import { patchDOM } from "./patch-dom";

type ApplicationState = Record<string, unknown>;

export type GenericComponentInstance = ComponentInstance<Record<string, unknown>, Record<string, unknown>>


// TODO clarify typeof Component vs Component as return type

// provides a strictly typed `this` context for viewFunction() in defineComponent()
export interface ComponentInstance<
  TProps extends Record<string, unknown>,
  TApplicationState extends ApplicationState,
> {
  state: TApplicationState;
  props: TProps;
  updateState(newState: Partial<TApplicationState>): void;
  offset: number;
  // todo should elements, offset and firstChild also be part of the interface
  // todo should I test them (e.g., `componentInstance.elements is empty if not mounted, etc.`)
}

export function defineComponent<
  TProps extends Record<string, unknown>,
  TApplicationState extends Record<string, unknown>,
>({
  viewFunction,
  initialState,
}: {
  // ComponentInstance interface ensures that `this` will have required properties when viewFunction() is called
  viewFunction: (this: ComponentInstance<TProps, TApplicationState>) => VNode;
  initialState: (props: TProps) => TApplicationState;
}) {
  class Component {
    #isMounted: boolean = false;
    #vdom: VNode | null = null;
    #hostEl: HTMLElement | null;
    props: TProps;
    state: TApplicationState;

    // reference to the mounted DOM elements
    get elements(): Array<VNode["el"]> {
      if (this.#vdom === null) return [];

      if (this.#vdom.type === "fragment") {
        // if vdom top node is a fragment, return the elements inside the fragment
        return extractChildren(this.#vdom).map((child) => child.el!);
      } else {
        return [this.#vdom.el!];
      }
    }

    get firstElement() {
      return this.elements[0];
    }

    // offset only matters on the DOM level (because a fragment flattens out its children when rendering DOM)
    // offset is starting index for the children of the Component's root node
    // if a Node is an Element, the Element wraps all of its children in the DOM and therefore is offset 0
    // if a Node is an Fragment, there is no wrapper DOM node, so we need to know where the fragment's DOM begin (inside the parent)
    get offset() {
      if (this.#vdom?.type === "fragment") {
        // the component's first element offset inside the parent element
        return Array.from(this.#hostEl!.childNodes).indexOf(this.firstElement);
      } else {
        return 0;
      }
    }

    // initial state is defined on the level of the component factory (i.e., all instances will call the same function)
    // props are defined on the level of the component instances (i.e., each instance of a component has own props)
    // props are what makes each instance of a component individual
    constructor(props: TProps) {
      this.#hostEl = null;
      this.props = props;
      this.state = initialState(props);
    }

    updateState(newState: Partial<TApplicationState>): void {
      this.state = { ...this.state, ...newState };
      this.#patch();
    }

    updateProps() {
      throw new Error("not yet implemented");
    }

    render(): VNode {
      // Because JS modules automatically run in "strict mode," 
      // any function called without an explicit this context (not as a method of an object)
      // will have this set to undefined.

      // i.e., render is a method and has implicit this, 
      // but viewFunction comes from outside and therefore needs an explicit this

      // `viewFunction.call(this)` invokes the `viewFunction` with `this` set to the
      // current component instance.
      // The type annotation `(this: ComponentInstance<...>)` for the `viewFunction`
      // in `defineComponent`'s signature enforces this, ensuring type safety.
      return viewFunction.call(this);
    }

    // patch the DOM of the component when the component state changes
    #patch(): void {
      if (!this.#isMounted) throw new Error("Component is not mounted!");

      const newVdom = this.render();

      this.#vdom = patchDOM(this.#vdom!, newVdom, this.#hostEl!, this);
    }

    mount(hostEl: HTMLElement, index: null | number = null) {
      if (this.#isMounted) throw new Error("Component is already mounted!");

      this.#vdom = this.render();
      mountDOM(this.#vdom, hostEl, index);

      this.#isMounted = true;
      this.#hostEl = hostEl;
    }

    unmount() {
      if (!this.#isMounted) throw new Error("Component is not mounted!");

      destroyDOM(this.#vdom!);
      this.#vdom = null;
      this.#hostEl = null;
      this.#isMounted = false;
    }
  }

  return Component;
}
