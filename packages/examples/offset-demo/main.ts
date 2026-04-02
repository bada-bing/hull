import { defineComponent } from "@hull/framework/runtime/component";
import { h, hFragment, VNode } from "@hull/framework/runtime/h";
import { mountDOM } from "@hull/framework/runtime/mount-dom";
import { patchDOM } from "@hull/framework/runtime/patch-dom";

const appContainer = document.getElementById("app")!;

// =========================================================================
// DEMO 1: STATEFUL COMPONENT (Needs Offset)
// =========================================================================

/**
 * Unlike stateless functions, Stateful Components are initialized as class instances, so they "own" their own lifecycle.
 * 
 * When you call this.updateState(), it does not trigger the parent container to re-render.
 * 
 * The component grabs its own, locally preserved #vdom and diffs it against its new result. 
 * Because it's isolated, its virtual array is mathematically indexed from 0 to array.length.
 * 
 * When #patch() creates its localized Diff, the component knows:
 * "I need to change my 0th list item! Hey statefulUl (my parent container), update your 0th physical child!"
 * 
 * But wait! Physical child 0 inside statefulUl is already occupied by the static li. The component's DOM nodes don't actually begin until physical index 1.
 * This is where offset saves the day. The component figures out dynamically (by reading the DOM) that its very first item sits at physical index 1. So when it patches the DOM, it does:
 * "I need to update my virtual 0th item... but I'll add my offset: 1, and update physical DOM child 1 instead!"
 * 
 *  So when it patches the DOM, it does: 
 * "I need to update my virtual 0th item... but I'll add my offset: 1, and update physical DOM child 1 instead!"
 * 
 * They only need an offset when the component's #vdom is a Fragment. (Important hint: Component is not its #vdom, #vdom is just a snapshot)
 * 
 * If the component instead rendered a single root Element, like a <div class="component-wrapper">...</div>, then the component exclusively owns everything inside that <div>. 
 * When the component patches its children, it's patching them inside that <div>. 
 * Because nothing else but the component lives inside that <div>, its virtual index 0 flawlessly maps to the physical DOM 0 of that <div>.
 * 
 * But because a Fragment has no wrapping <div>, its naked children are forced to be direct roommates with other elements in the parent container. 
 * That lack of exclusive boundaries means it must track an offset to remember exactly where its "room" starts inside the parent "house".
 * 
 * Offset is needed only for patching, not for initial mounting
 * When mounting initially, the framework is using appendChild to put the new nodes at the end of the hostEl 
 * and therefore it doesn't need to thing about indices, because there is no specific "surgical" injection needed.
 * 
 * Offset is only needed for patching children, and only for MOVE and ADD operations
 * 
 */
const statefulUl = document.createElement("ul");
appContainer.appendChild(statefulUl);

// Mount a static node (owns physical index 0)
const statefulStatic1 = h("li", { class: "static" }, ["Stateful Demo: Static Component (Idx 0)"]);
mountDOM(statefulStatic1, statefulUl);

// Stateful Component (Will own physical index 1+)
const StatefulList = defineComponent({
    initialState: () => ({ items: [1] }),
    viewFunction() {
        return hFragment(
            this.state.items.map((item: number, idx: number) => h("li", { class: "stateful" }, [
                `[Stateful] Configurable Item ${item} (Virtual Idx: ${idx}) `,
                h("button", { on: { click: () => this.addItem() } }, ["Add Stateful Item"])
            ]))
        );
    },
    addItem() {
        // Triggers internal `patchDOM` just for this component's VDOM fragment.
        // Needs `this.offset` because index 0 in its VDOM is actually physical index 1 in the `ul`!
        console.log(`[Stateful Demo] Patching independently! Using Offset: ${this.offset}`);
        this.updateState({ items: [...this.state.items, this.state.items.length + 1] });
    }
});

const myStatefulList = new StatefulList({});
myStatefulList.mount(statefulUl, null);

// Mount a trailing static node
const statefulStatic2 = h("li", { class: "static" }, ["Stateful Demo: Static Trailing Component"]);
mountDOM(statefulStatic2, statefulUl);

appContainer.appendChild(document.createElement("hr"));

// =========================================================================
// DEMO 2: STATELESS / CENTRALLY MANAGED (No Offset Needed)
// =========================================================================
const centralContainer = document.createElement("div");
appContainer.appendChild(centralContainer);

// Central State
let centralItems = ["[Stateless] Item A", "[Stateless] Item B"];

// Initial Render
let centralVdom: VNode = renderCentralApp();
mountDOM(centralVdom, centralContainer);

/**
 * Because a stateless component is just a simple JavaScript function returning an array of virtual nodes (an hFragment), it doesn't "own" anything. It has no internal memory (state), no this context, and no built-in updateState() method.
 * 
 * Therefore, it is impossible to patch just the stateless component in isolation. So, when underlying data changes, the whole app is re-rendered.
 * 
 * Because you are forced to patchDOM from the parent downwards, the framework evaluates the parent's children array as a whole. 
 * Your hFragment simply dissolves and flattens out into that parent's array. Since the array is evaluated from the very first item (index: 0) to the very last, the virtual indices perfectly match the physical DOM indices—meaning no offset is ever mathematically needed!
 * 
 */

// The "App" re-renders everything at once.
function renderCentralApp() {
    return h("ul", {}, [
        h("li", { class: "static" }, ["Central Demo: Static Node (Idx 0)"]),
        // We inject the stateless component. It just returns an array/fragment of VNodes.
        StatelessList(centralItems),
        h("li", { class: "static" }, ["Central Demo: Static Trailing Node (Always Last)"])
    ]);
}

// The Stateless Component is just a function returning VNodes!
function StatelessList(items: string[]) {
    return hFragment(
        items.map((item, idx) => h("li", { class: "stateless" }, [
            `${item} `,
            h("button", {
                on: {
                    click: () => {
                        console.log(`[Central Demo] Updating global state. Framework will patch the entire UL array!`);
                        centralItems.push(`[Stateless] Item NEW`);

                        // Because we patch the ENTIRE `ul` using centralVdom and newVdom,
                        // the framework array-diffs the whole child sequence from 0 -> length.
                        // The virtual index mathematically guarantees the exact physical position.
                        const newVdom = renderCentralApp();
                        centralVdom = patchDOM(centralVdom, newVdom, centralContainer);
                    }
                }
            }, ["Add Central Item"])
        ]))
    );
}
