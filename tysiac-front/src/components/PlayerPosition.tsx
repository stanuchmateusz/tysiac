import type { Player } from "../pages/Models";

export default function PlayerPosition({ player, position, cardCount = 0, cardDirection, highlightGold, isSelectable, isSelected, onSelect }: {
    player?: Player,
    position: string,
    isCurrentPlayer?: boolean,
    cardCount?: number,
    cardDirection?: 'normal' | 'left' | 'right',
    highlightGold?: boolean,
    isSelectable?: boolean,
    isSelected?: boolean,
    onSelect?: () => void
}) {
    if (!player) return null;

    // Ustal styl rotacji kart
    let cardStyle = '';
    if (cardDirection === 'left') cardStyle = 'rotate-[-90deg] origin-bottom left';
    if (cardDirection === 'right') cardStyle = 'rotate-[90deg] origin-bottom right';

    // Ustal flex-row dla linii kart
    let cardRowClass = 'flex gap-0.5'; // zmniejsz gap
    if (cardDirection === 'left') cardRowClass += ' flex-col-reverse';
    if (cardDirection === 'right') cardRowClass += ' flex-col';

    // Poprawne podświetlenie nicka na złoto
    let playerClass = 'rounded-full px-4 py-2 mb-2 cursor-pointer ';
    if (isSelected) {
        playerClass += 'bg-red-600 text-white font-bold border-2 border-red-400 animate-pulse ';
    } else if (highlightGold) {
        playerClass += 'bg-yellow-400 text-black font-bold border-2 border-yellow-300 animate-pulse ';
    } else {
        playerClass += 'bg-gray-800 ';
    }
    if (!isSelectable) playerClass += ' cursor-default ';

    return (
        <div className={`absolute ${position} flex flex-col items-center`}>
            <div className={playerClass} onClick={isSelectable && onSelect ? onSelect : undefined}>{player.nickname}</div>
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
