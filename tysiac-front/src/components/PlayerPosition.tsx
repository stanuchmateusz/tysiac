import type { Player } from "../pages/Models";

export default function PlayerPosition({ player, position, cardCount = 0, cardDirection, highlightGold, isSelectable, isTakeWinner, isSelected, onSelect, hasPassed }: {
    player?: Player,
    position: string,
    isCurrentPlayer?: boolean,
    cardCount?: number,
    cardDirection?: 'normal' | 'left' | 'right',
    highlightGold?: boolean,
    hasPassed?: boolean,
    isTakeWinner?: boolean,
    isSelectable?: boolean,
    isSelected?: boolean,
    onSelect?: () => void
}) {
    if (!player) return null;

    let cardStyle = '';
    if (cardDirection === 'left') cardStyle = 'rotate-[-90deg] origin-bottom left';
    if (cardDirection === 'right') cardStyle = 'rotate-[90deg] origin-bottom right';


    let cardRowClass = 'flex gap-0.5';
    if (cardDirection === 'left') cardRowClass += ' flex-col-reverse';
    if (cardDirection === 'right') cardRowClass += ' flex-col';

    let playerClass = 'rounded-full px-4 py-2 mb-2 cursor-pointer transition-all duration-150 ';
    let borderColorClass = 'border-gray-700';

    if (isSelected) {
        playerClass += 'bg-red-600 text-white font-bold animate-pulse ';
        borderColorClass = 'border-red-400';
    } else if (highlightGold) {
        playerClass += 'bg-yellow-400 text-black font-bold animate-pulse ';
        borderColorClass = 'border-yellow-300';
    } else if (hasPassed) {
        playerClass += 'bg-gray-800 text-gray-300 ';
        borderColorClass = 'border-green-400';
    } else if (isTakeWinner) {
        playerClass += 'bg-green-500 text-white ';
        borderColorClass = 'border-green-400';
    }
    else {
        playerClass += 'bg-gray-800 text-white ';
    }
    playerClass += `border-2 ${borderColorClass} `;
    if (!isSelectable && !onSelect) playerClass += ' cursor-default ';
    return (
        <div className={`absolute ${position} flex flex-col items-center`}>
            <div className="flex flex-col items-center"> {/* Kontener dla napisu PASS i nicku */}
                {hasPassed && <span className="font-bold text-green-400 mb-1 text-sm">PASS</span>} {/* Napis PASS nad nickiem */}
                <div className={playerClass} onClick={isSelectable && onSelect ? onSelect : undefined}>{player.nickname}</div>
            </div>
            <div className={cardRowClass}>
                {Array.from({ length: cardCount }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md shadow-md ${cardStyle}`}
                    />
                ))}
            </div>
        </div>
    );
}
