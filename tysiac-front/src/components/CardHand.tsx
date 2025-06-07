import type { Card } from "../pages/Models";
import { CARD_RANKS, CARD_SVG_PATH, SUIT_ICONS } from "../pages/Table";

export default function CardHand({ cards, onCardSelect, disabled = false, canPlayCard }: {
    cards: Card[],
    onCardSelect: (card: string) => void,
    disabled?: boolean,
    canPlayCard?: (card: Card) => boolean
}) {
    return (
        <div className="flex gap-4 justify-center items-end w-full pb-8">
            {cards.map(card => (
                <button
                    key={card.shortName}
                    disabled={disabled || (canPlayCard ? !canPlayCard(card) : false)}
                    onClick={() => onCardSelect(card.shortName)}
                    className={`transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 
                                ${(disabled || (canPlayCard && !canPlayCard(card))) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <img
                        src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                        alt={`${CARD_RANKS[card.name]} ${SUIT_ICONS[card.suit]}`}
                        className="w-20 h-28 drop-shadow-lg"
                    />
                </button>
            ))}
        </div>
    );
}