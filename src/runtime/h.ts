import { withoutNulls } from "./arrays";
import { Listeners } from "./mount-dom";

export const VDOM_TYPES = {
    TEXT: "text",
    ELEMENT: "element",
    FRAGMENT: "fragment"
} as const;

export interface VElement {
    el?: HTMLElement,
    listeners?: Listeners,
    tag: string,
    props: {},
    children: VNode[],
    type: typeof VDOM_TYPES["ELEMENT"]
}

export interface VText {
    el?: Text,
    type: typeof VDOM_TYPES["TEXT"]
    value: string
}

export interface VFragment {
    el?: HTMLElement,
    type: typeof VDOM_TYPES["FRAGMENT"]
    children: VNode[]
}

export type VNode = VElement | VText | VFragment

/**
 * Create vnode element (virtual node)
 * 
 * h is short for hyperscript -> a script that creates hypertext
 * essentially this function serves a similar purpose as HTML markup,
 * and that is to create structure which can be used to generate DOM
 */
export function h(tag: string, props = {}, children: (string | VElement | null)[] = []): VElement {
    return {
        type: VDOM_TYPES.ELEMENT,
        tag,
        props,
        children: withoutNulls(mapStringsToTextNodes(children))
    }
}

function hString(text: string): VText {
    return {
        type: VDOM_TYPES.TEXT,
        value: text
    }
}

function mapStringsToTextNodes(nodes: (string | VElement | null)[]): (VText | VElement | null)[] {
    return nodes.map(n => typeof n === "string" ? hString(n) : n)
}

function hFragment(nodes: (string | VElement | null)[]): VFragment {
    return {
        type: VDOM_TYPES.FRAGMENT,
        children: withoutNulls(mapStringsToTextNodes(nodes))
    }
}