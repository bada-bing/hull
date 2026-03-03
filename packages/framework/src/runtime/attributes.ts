export function setAttribute(
  attributeName: string,
  element: HTMLElement,
  attributeValue?: string | number | null,
) {
  if (attributeValue === null || attributeValue === undefined) {
    removeAttribute(attributeName, element);
  } else if (attributeName.startsWith("data-")) {
    element.setAttribute(attributeName, String(attributeValue));
  } else {
    // @ts-expect-error
    element[attributeName] = attributeValue;
  }
}

export function removeAttribute(attr: string, element: HTMLElement) {
  try {
    // try to set DOM property to null (e.g., value)
    // @ts-expect-error
    element[attr] = null;
  } catch (e) {
    console.warn(`failed to set ${attr} to null for ${element.tagName}`);
  }
  // remove HTML attribute
  element.removeAttribute(attr);
}

export function cssTextToRecord(style?: string): Record<string, string> {
  const cssRecord: Record<string, string> = {};

  if (!style) return cssRecord;

  style.split(";").forEach((rule) => {
    rule = rule.trim();
    if (!rule) return;

    const colonIndex = rule.indexOf(":");
    if (colonIndex === -1) throw new Error(`malformed CSS rule: ${rule}`);

    const key = rule.slice(0, colonIndex).trim();
    const value = rule.slice(colonIndex + 1).trim();

    if (key && value) {
      const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      cssRecord[camelCaseKey] = value;
    }
  });

  return cssRecord;
}
