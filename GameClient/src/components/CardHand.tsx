import React from 'react';
import type { Card } from "../pages/Models";
import { CARD_SVG_PATH } from "../pages/Table";
import { CARD_RANKS,SUIT_ICONS } from "../utils/CardConsts";

export default function CardHand({
    cards,
    onCardDragStart,
    onCardDragEnd,
    onCardClick,
    disabled = false,
    canPlayCard
}: {
    cards: Card[],
    onCardDragStart: (event: React.DragEvent<HTMLDivElement>, card: Card) => void,
    onCardDragEnd: () => void,
    onCardClick?: (card: Card) => void,
    disabled?: boolean,
    canPlayCard?: (card: Card) => boolean
}) {
    const playableMap = React.useMemo(
        () => Object.fromEntries(cards.map(card => [card.shortName, !canPlayCard || canPlayCard(card)])),
        [cards, canPlayCard]
    );

    return (
        <div className="flex gap-4 justify-center items-end w-full pb-8">
            {cards.map(card => {
                const isPlayable = playableMap[card.shortName];
                return (
                    <div
                        key={card.shortName}
                        draggable={!disabled && isPlayable}
                        onDragStart={(e) => {
                            if (!disabled && isPlayable) onCardDragStart(e, card);
                        }}
                        onDragEnd={onCardDragEnd}
                        onClick={() => {
                            if (!disabled && isPlayable && onCardClick) onCardClick(card);
                        }}
                        className={`transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 
                            ${(disabled || !isPlayable) ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'}`}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <img
                            src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                            alt={`${CARD_RANKS[card.rank]} ${SUIT_ICONS[card.suit]}`}
                            className="w-20 h-28 drop-shadow-lg"
                        />
                    </div>
                );
            })}
        </div>
    );
}