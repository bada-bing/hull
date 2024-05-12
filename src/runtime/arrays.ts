export function withoutNulls(nodes: []) {
    return nodes.filter(n => n != null)
}