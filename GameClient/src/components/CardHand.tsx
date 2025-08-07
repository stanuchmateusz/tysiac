
import { useMemo } from "react";
import type { Card } from "../pages/Models";
import { CARD_SVG_PATH } from "../pages/Table";
import { CARD_RANKS, SUIT_ICONS } from "../utils/CardConsts";
import { cardSizeCookieName, getCookie } from '../utils/Cookies';

const CARD_SIZE: Record<string, string> = {
    "xs": "w-16 h-24",
    "s": "w-18 h-26",
    "m": "w-20 h-28",
    "l": "w-24 h-34",
    "xl": "w-30 h-42",
    "xxl": "w-36 h-50",
    "xxxl": "w-40 h-56"
};

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
    const playableMap = useMemo(
        () => Object.fromEntries(cards.map(card => [card.shortName, !canPlayCard || canPlayCard(card)])),
        [cards, canPlayCard]
    );
    const cardSize = getCookie(cardSizeCookieName) || 'm';

    const cardStyle = () => {
        return CARD_SIZE[cardSize] || CARD_SIZE['m']; // Default to 'm' if not found
    }

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
                        style={{ touchAction: 'none' }}
                    >
                        <img
                            src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                            alt={`${CARD_RANKS[card.rank]} ${SUIT_ICONS[card.suit]}`}
                            className={`${cardStyle()} drop-shadow-lg rounded-md`}
                        />
                    </div>
                );
            })}
        </div>
    );
}