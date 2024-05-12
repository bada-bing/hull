// TODO PENDING for TS 5.5 and inline the _notNull predicate function into the expression children.filter(...)
// with TS 5.5 is possible to infer (i.e., inline) the filter predicate
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-5-beta/#inferred-type-predicates
export function _notNull<T>(val: T | null): val is T {
    return val != null
}

export function withoutNulls<T>(nodes: (T | null)[]): T[] {
    return nodes.filter(_notNull);
}