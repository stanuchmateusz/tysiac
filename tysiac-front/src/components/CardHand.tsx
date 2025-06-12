import React from 'react';
import type { Card } from "../pages/Models";
import { CARD_RANKS, CARD_SVG_PATH, SUIT_ICONS } from "../pages/Table";

export default function CardHand({ cards, onCardDragStart, onCardDragEnd, disabled = false, canPlayCard }: {
    cards: Card[],
    onCardDragStart: (event: React.DragEvent<HTMLDivElement>, card: Card) => void,
    onCardDragEnd: () => void,
    disabled?: boolean,
    canPlayCard?: (card: Card) => boolean
}) {
    return (
        <div className="flex gap-4 justify-center items-end w-full pb-8">
            {cards.map(card => (
                <div
                    key={card.shortName}
                    draggable={!disabled && (!canPlayCard || canPlayCard(card))}
                    onDragStart={(e) => {
                        if (!disabled && (!canPlayCard || canPlayCard(card))) {
                            onCardDragStart(e, card);
                        }
                    }}
                    onDragEnd={onCardDragEnd}
                    className={`transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 
                                ${(disabled || (canPlayCard && !canPlayCard(card))) ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'}`} // Zmieniono cursor na grab
                >
                    <img
                        src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                        alt={`${CARD_RANKS[card.rank]} ${SUIT_ICONS[card.suit]}`}
                        className="w-20 h-28 drop-shadow-lg"
                    />
                </div>
            ))}
        </div>
    );
}