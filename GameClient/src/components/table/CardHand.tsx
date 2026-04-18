import { useDraggable } from "@dnd-kit/core";
import type { Card } from "../../pages/Models";
import CardComponent from "../CardComponent";

const CARD_SIZE: Record<string, string> = {
  xs: "w-16 h-24",
  s: "w-18 h-26",
  m: "w-20 h-28",
  l: "w-24 h-34",
  xl: "w-30 h-42",
  xxl: "w-36 h-50",
  xxxl: "w-40 h-56",
};

export default function CardHand({
  cards,
  onCardClick,
  disabled = false,
  playableCards,
}: {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  disabled?: boolean;
  playableCards?: Map<string, boolean>;
}) {
  const DraggableCard = (props: any) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: props.id,
      disabled: props.draggable ? false : true,
      data: { card: props.card },
    });

    const style = transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined;

    return (
      <button
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`relative touch-manipulation ${isDragging ? "z-50" : "z-10"}`}
      >
        {props.children}
      </button>
    );
  };

  return (
    <div className="w-full pb-6 sm:pb-8">
      <div
        className="
          flex justify-center items-end
          
          px-2 sm:px-0
          scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent
        "
      >
        {cards.map((card, idx) => {
          const shortName = card.shortName;
          const isPlayable = playableCards?.get(shortName);

          const middle = (cards.length - 1) / 2;
          const angleStep = 15 / (cards.length || 1); // max ~15°
          const rotation = (idx - middle) * angleStep;

          return (
            <DraggableCard
              draggable={!disabled && isPlayable}
              id={shortName}
              key={shortName}
              card={card}
              onClick={() => {
                if (!disabled && isPlayable && onCardClick) onCardClick(card);
              }}
            >
              <div
                className={`
                  relative -ml-6 first:ml-0
                  transition-all duration-200 transform origin-bottom
                  hover:-translate-y-4 hover:scale-110 active:scale-110
                  ${disabled || !isPlayable ? "opacity-50 cursor-not-allowed" : "cursor-grab"}
                `}
                style={{ rotate: `${rotation}deg` }}
              >
                <CardComponent card={card} cardSizeRecord={CARD_SIZE} />
              </div>
            </DraggableCard>
          );
        })}
      </div>
    </div>
  );
}
