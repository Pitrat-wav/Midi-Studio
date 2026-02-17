import type { Edge } from 'reactflow'

export function hasCycle(nodes: string[], edges: Edge<any>[]): boolean {
    const adj = new Map<string, string[]>()
    nodes.forEach(id => adj.set(id, []))
    edges.forEach(e => {
        if (adj.has(e.source)) adj.get(e.source)!.push(e.target)
    })

    const visited = new Set<string>()
    const recStack = new Set<string>()

    const check = (v: string): boolean => {
        if (!visited.has(v)) {
            visited.add(v)
            recStack.add(v)
            const neighbors = adj.get(v) || []
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && check(neighbor)) return true
                if (recStack.has(neighbor)) return true
            }
        }
        recStack.delete(v)
        return false
    }

    for (const node of nodes) {
        if (check(node)) return true
    }
    return false
}
