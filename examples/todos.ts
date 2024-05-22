// Generate App Component and mount it to body

import { VText, h } from "../src/runtime/h";
import { mountDOM } from "../src/runtime/mount-dom";

/**
 * section
 * h1 My Blog
 * Welcome to My Blog
 */

const output = h("section", {}, [
  h("h1", {}, ["My Blog"]),
  h("p", {}, ["Welcome to My Blog!"]),
]);

const textExample: VText = {
  type: "text",
  value: "an examplary text to be shown on the screen",
};

let bodyElement = document.body as HTMLBodyElement;
const div = document.createElement("div");
div.textContent = "what' up, little dog";
bodyElement.appendChild(div);
mountDOM(textExample, bodyElement);
mountDOM(output, bodyElement);
