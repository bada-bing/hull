type Diff = {
  added: string[];
  removed: string[];
  updated: string[];
};

export function isObject(a: unknown): a is Record<string, unknown> {
  return typeof a == "object" && a !== null;
}

export function objectsDiff(a: Record<string, unknown>, b: Record<string, unknown>): Diff {
  if (!isObject(a)) throw new Error("a is not an object");
  if (!isObject(b)) throw new Error("b is not an object");

  // all properties which are in second, but not in first object
  const added = Object.keys(b).filter(
    (attribute) => !Object.keys(a).includes(attribute),
  );

  // all properties which are in first, but not in second object
  const removed = Object.keys(a).filter(
    (attribute) => !Object.keys(b).includes(attribute),
  );

  const updated = Object.keys(a).filter(
    (attribute) =>
      Object.keys(b).includes(attribute) && a[attribute] !== b[attribute],
  );

  return {
    added,
    removed,
    updated,
  };
}
