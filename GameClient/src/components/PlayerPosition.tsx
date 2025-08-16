import type { Player } from "../pages/Models";
import React from 'react';
import { cardSizeCookieName, getCookie } from "../utils/Cookies";
import { useDroppable } from "@dnd-kit/core";
import { DnDTypes } from "../utils/DndTypes";

export interface PlayerPositionProps {
    player?: Player,
    position: string,
    cardCount?: number,
    cardDirection?: 'normal' | 'left' | 'right' | 'none',
    highlightGold?: boolean,
    hasPassed?: boolean,
    isTakeWinner?: boolean,
    isDropTargetActive?: boolean;
}

const PlayerPosition: React.FC<PlayerPositionProps> = ({ player, position, cardCount = 0, cardDirection = 'none', highlightGold, isTakeWinner, hasPassed, isDropTargetActive }) => {
    
    const { active,isOver, setNodeRef } = useDroppable({
            id: DnDTypes.TABLE_PLAYER+player?.id,
            disabled: !isDropTargetActive,
            data: {
                player: player
            }
          });
    if (!player) return null;

    let cardStyle = '';
    if (cardDirection === 'left') cardStyle = 'rotate-[-90deg] origin-bottom left';
    if (cardDirection === 'right') cardStyle = 'rotate-[90deg] origin-bottom right';


    let cardRowClass = 'flex gap-0.5';
    if (cardDirection === 'left') cardRowClass += ' flex-col-reverse';
    if (cardDirection === 'right') cardRowClass += ' flex-col';

    let playerInfoClass = 'rounded-full px-4 py-2 mb-2 transition-all duration-150 ';
    let borderColorClass = 'border-gray-700';

    if (highlightGold) {
        playerInfoClass += 'bg-yellow-400 text-black font-bold animate-pulse ';
        borderColorClass = 'border-yellow-300';
    } else if (hasPassed) {
        playerInfoClass += 'bg-gray-800 text-gray-300 ';
        borderColorClass = 'border-green-400';
    } else if (isTakeWinner) {
        playerInfoClass += 'bg-green-500 text-white ';
        borderColorClass = 'border-green-400';
    }
    else {
        playerInfoClass += 'bg-gray-800 text-white ';
    }
    playerInfoClass += `border-2 ${borderColorClass} cursor-default `;

    const dropZoneClasses = isOver && isDropTargetActive
        ? 'border-green-500 bg-green-700/30 backdrop-blur-sm'
        : 'border-transparent';

    const cardSize = getCookie(cardSizeCookieName) || 'm';

    const cardSizeClasses: Record<string, string> = {
        "xs": "min-w-[100px] min-h-[130px]",
        "s": "min-w-[120px] min-h-[150px]",
        "m": "min-w-[140px] min-h-[170px]",
        "l": "min-w-[160px] min-h-[200px]",
        "xl": "min-w-[180px] min-h-[230px]",
        "xxl": "min-w-[200px] min-h-[260px]",
        "xxxl": "min-w-[220px] min-h-[290px]"
    };

    return (
    <div
        className={`absolute ${position} ${cardSizeClasses[cardSize] || cardSizeClasses['m']} flex flex-col items-center p-2 rounded-xl  transition-all duration-150 ${dropZoneClasses} hover:scale-[1.03]`}
        ref={setNodeRef}
        style={{
            pointerEvents: isOver && isDropTargetActive ? 'auto' : 'none'
        }}
    >
        <div className="flex flex-row items-center gap-1 mb-2">
            {/* Avatar z inicjałami
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md
                ${highlightGold ? "bg-yellow-300 text-black animate-pulse" : isTakeWinner ? "bg-green-500 text-white animate-pulse" : "bg-blue-900 text-blue-200"}
            `}>
                {player.nickname.slice(0, 2).toUpperCase()}
            </div> */}
            {/* Nick + PASS badge */}
            <div className={playerInfoClass}>
                {player.nickname}
                {hasPassed && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-green-400 text-white text-xs font-bold shadow">PASS</span>
                )}
            </div>
        </div>
        {/* Karty */}
        <div className={cardRowClass}>
            {Array.from({ length: cardCount }).map((_, idx) => (
                <div
                    key={idx}
                    className={`w-10 h-14 bg-gradient-to-br from-blue-900 to-blue-700 border-2 border-blue-700 rounded-lg shadow-lg ${cardStyle} transition-all duration-150`}
                />
            ))}
        </div>
        {/* Drop zone */}
        {active && isDropTargetActive && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80 text-xs pointer-events-none bg-green-700/40 rounded-xl animate-pulse">
                Upuść kartę
            </div>
        )}
    </div>
);
}

export default PlayerPosition;
