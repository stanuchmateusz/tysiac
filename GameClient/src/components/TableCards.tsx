import type { GameContext, GameUserContext } from "../pages/Models";
import { cardSizeCookieName, getCookie } from "../utils/Cookies";
import CardComponent from "./CardComponent";

type TableCardsProps = {
    gameCtx?: GameContext | null;
    gameUserCtx?: GameUserContext | null;
    firstPlayerInCurrentTake: React.RefObject<string | null>;
};
const TableCards: React.FC<TableCardsProps> = ({gameCtx,gameUserCtx,firstPlayerInCurrentTake}) => {
    
    return (() => {
            if (!gameCtx?.cardsOnTable?.length || !gameUserCtx) return null;

            const playerOrder = [
                gameUserCtx.me?.connectionId,
                gameUserCtx.leftPlayer?.connectionId,
                gameUserCtx.teammate?.connectionId,
                gameUserCtx.rightPlayer?.connectionId
            ];

            const leaderId = firstPlayerInCurrentTake.current;
            console.debug("Leader ID:", leaderId, "Player Order:", playerOrder);
            var indexOfLeader = leaderId ? playerOrder.indexOf(leaderId) : -1;

            if (indexOfLeader === -1 && gameCtx.cardsOnTable.length > 0) {
                console.error("Leader now found in playerOrder or firstPlayerInTrick.current is not set!");
                indexOfLeader = 0; // Fallback to first player in order
                // return null;
            }

            const slotNames = ['bottom', 'left', 'top', 'right'];

            // Cards on the table, positioned based on player order
            return gameCtx.cardsOnTable.map((card, cardIndexInTrick) => {
                const style: React.CSSProperties = {
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10 + cardIndexInTrick,
                };
                let rotation = 0;
                let offsetX = 0, offsetY = 0;


                const playerVisualIndex = (indexOfLeader + cardIndexInTrick) % playerOrder.length;
                const pos = slotNames[playerVisualIndex];

                const cardSize = getCookie(cardSizeCookieName) || 'm';

                // const CARD_SIZE: Record<string, string> = {
                //     "xs": "w-12 h-17",
                //     "s": "w-14 h-20",
                //     "m": "w-16 h-24",
                //     "l": "w-22 h-32",
                //     "xl": "w-24 h-34",
                //     "xxl": "w-28 h-40",
                //     "xxxl": "w-32 h-44"
                // };
                const ADDITIONAL_OFFSET: Record<string, number> = {
                    "xs": -20,
                    "s": -10,
                    "m": 0,
                    "l": 30,
                    "xl": 40,
                    "xxl": 60,
                    "xxxl": 80
                };

                if (pos === 'bottom') { offsetY = 90 + ADDITIONAL_OFFSET[cardSize]; rotation = 0; }
                if (pos === 'left') { offsetX = -90 - ADDITIONAL_OFFSET[cardSize]; rotation = 90; }
                if (pos === 'top') { offsetY = -90 - ADDITIONAL_OFFSET[cardSize]; rotation = 180; }
                if (pos === 'right') { offsetX = 90 + ADDITIONAL_OFFSET[cardSize]; rotation = -90; }

                style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;

                return (
                    <CardComponent 
                        key={card.shortName + cardIndexInTrick}
                        style={style} card={card}/>
                );
            });
        })();
}
export default TableCards;