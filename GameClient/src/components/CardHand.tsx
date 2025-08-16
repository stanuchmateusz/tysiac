import { useDraggable } from "@dnd-kit/core";
import type { Card } from "../pages/Models";
import CardComponent from "./CardComponent";

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
    onCardClick,
    disabled = false,
    playableCards
}: {
    cards: Card[],
    onCardClick?: (card: Card) => void,
    disabled?: boolean,
    playableCards?: Map<string, boolean>,// cardShortName to isPlayable
}) {
    const DraggableCard = (props :any) => {
      const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: props.id,
        disabled: props.draggable ? false : true,
        data: { card: props.card },
      });
    
      const style = transform ? { // makes the draggable element move
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      } : undefined;
    
      return (
        <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
          {props.children}
        </button>
      );
    }

    return (
        <div className="flex gap-4 justify-center items-end w-full pb-8">
            {cards.map(card => {
                const shortName = card.shortName;
                const isPlayable = playableCards?.get(shortName);
                return (
                    <DraggableCard
                        draggable={!disabled && isPlayable}
                        id={shortName}
                        card={card}
                        onClick={() => {
                            if (!disabled && isPlayable && onCardClick) onCardClick(card);
                        }}
                        // style={{ touchAction: 'none' }} todo check this
                    >
                        <div
                            className={`transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 
                            ${(disabled || !isPlayable) ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'}`}
                        >
                        <CardComponent card={card} cardSizeRecord={CARD_SIZE} />
                        </div>
                    </DraggableCard>
                );
            })}
        </div>
    );
}