import { useDroppable } from "@dnd-kit/core";
import { DnDTypes } from "../../utils/DndTypes";

const TableCardsDropZone = (props: any) => {
    const droppingAllowed = props.allowDroping as boolean;

    const { isOver: isDraggingCard, active, setNodeRef } = useDroppable({
        id: DnDTypes.TABLE,
        disabled: !droppingAllowed,
    });

    return (
        <div
            ref={setNodeRef}
            className={`absolute inset-0 m-auto w-1/2 h-1/2 border-2 border-dashed rounded-lg transition-all duration-150
                                            ${active && droppingAllowed
                    ? 'border-green-500 bg-green-700/30 backdrop-blur-sm'
                    : 'border-transparent'}
            `}
            style={{
                pointerEvents: (isDraggingCard && droppingAllowed) ? 'auto' : 'none',
                zIndex: 5 // Below cards on table, but catch drops
            }}
        >
            {active && droppingAllowed && (
                <span className="flex items-center justify-center h-full text-white/70 text-sm">Upuść tutaj</span>
            )}
        </div>
    );
}
export default TableCardsDropZone;