import type { Player } from "../pages/Models";
import React from 'react';

export interface PlayerPositionProps {
    player?: Player,
    position: string,
    cardCount?: number,
    cardDirection?: 'normal' | 'left' | 'right' | 'none',
    highlightGold?: boolean,
    hasPassed?: boolean,
    isTakeWinner?: boolean,
    onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
    isDropTargetActive?: boolean;
}

const PlayerPosition: React.FC<PlayerPositionProps> = ({ player, position, cardCount = 0, cardDirection = 'none', highlightGold, isTakeWinner, hasPassed, onDragOver, onDrop, isDropTargetActive }) => {
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

    const dropZoneClasses = isDropTargetActive
        ? 'border-green-500 bg-green-700/30 backdrop-blur-sm'
        : 'border-transparent';

    return (
        <div
            className={`absolute ${position} flex flex-col items-center p-2 rounded-lg transition-all duration-150 ${dropZoneClasses}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{
                pointerEvents: onDragOver && onDrop && isDropTargetActive ? 'auto' : 'none',
                minWidth: '120px',
                minHeight: '150px',
            }}
        >
            <div className="flex flex-col items-center">
                {hasPassed && <span className="font-bold text-green-400 mb-1 text-sm">PASS</span>}
                <div className={playerInfoClass}>{player.nickname}</div>
            </div>
            <div className={cardRowClass}>
                {Array.from({ length: cardCount }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md shadow-md ${cardStyle}`}
                    />
                ))}
            </div>
            {isDropTargetActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-xs pointer-events-none">
                    Upuść kartę
                </div>
            )}
        </div>
    );
}

export default PlayerPosition;
