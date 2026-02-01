import React, { memo } from 'react'
import { Trash2, Copy, X } from 'lucide-react'

interface ContextMenuProps {
    x: number
    y: number
    nodeId: string | null
    onClose: () => void
    onDelete: () => void
    onDuplicate: () => void
}

export const ContextMenu = memo(({ x, y, nodeId, onClose, onDelete, onDuplicate }: ContextMenuProps) => {
    return (
        <div
            className="context-menu"
            style={{ top: y, left: x, position: 'absolute', zIndex: 1000 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="context-header">
                <span>{nodeId ? 'NODE ACTIONS' : 'CANVAS'}</span>
                <button className="context-close" onClick={onClose}><X size={12} /></button>
            </div>

            {nodeId && (
                <>
                    <button className="context-item" onClick={onDuplicate}>
                        <Copy size={14} /> Duplicate
                    </button>
                    <button className="context-item delete" onClick={onDelete}>
                        <Trash2 size={14} /> Delete
                    </button>
                </>
            )}
            {!nodeId && (
                <div className="context-item disabled">Select a node...</div>
            )}
        </div>
    )
})
