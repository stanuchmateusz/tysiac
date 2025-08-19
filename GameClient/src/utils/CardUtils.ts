import type { Card, GameContext, GameUserContext } from "../pages/Models";

export const SUIT_ICONS: Record<number, string> = {
    1: '♠', // Spades
    2: '♣', // Clubs
    3: '♥', // Hearts
    4: '♦'  // Diamonds
};

export const SUIT_VALUES: Record<number, number> = {
    1: 40, // Spades
    2: 60, // Clubs
    3: 100, // Hearts
    4: 80 // Diamonds
};
export const CARD_RANKS: Record<number, string> = {
    1: 'A',
    2: 'K',
    3: 'Q',
    4: 'J',
    5: '10',
    6: '9'
};

export const CARD_SVG_PATH = import.meta.env.VITE_ASSETS_PATH || "/public/assets/default/";

export const cardValue = (rank: number): number => {
    if (rank === 1) return 11; // Ace
    if (rank === 5) return 10; // 10
    if (rank === 2) return 4; // King
    if (rank === 3) return 3; // Queen
    if (rank === 4) return 2; // Jack
    if (rank === 6) return 0; // 9
    return 0; // Default case for invalid ranks
};

export const canPlayCard = (card: Card, gameCtx:GameContext, gameUserCtx: GameUserContext): boolean => {
        if (!gameCtx || !gameUserCtx) return true;
        if (gameCtx.gamePhase !== 3) return true;
        if (!gameCtx.cardsOnTable || gameCtx.cardsOnTable.length === 0) return true; // table is empty, can play any card
        const firstCardInTake = gameCtx.cardsOnTable[0];
        const trumpSuit = gameCtx.trumpSuit;
        const hand = gameUserCtx.hand;
        const handWithoutPlayedCard = hand.filter(c => c != card)

        const minReqPoint = Math.max(...gameCtx.cardsOnTable.filter(c => c.suit == firstCardInTake.suit).map(o => o.points)) ?? firstCardInTake.points;

        if (card.suit === firstCardInTake.suit && (card.points > minReqPoint || !(handWithoutPlayedCard.find(c => (c.suit == card.suit && c.points > minReqPoint))))) { //i nie moze przebić inną 
            console.debug("Same color - can play", card.shortName);
            return true;
        };

        if (card.suit === trumpSuit && !handWithoutPlayedCard.find(c => c.suit == firstCardInTake.suit)) { //player has trump card and no same color cards
            console.debug("Trump card - can play", card.shortName, trumpSuit);
            return true;
        }

        const hasStackColor = hand.every(c => c.suit !== firstCardInTake.suit);
        // If the player has no cards of the leading suit and there is a trump suit ...
        if (hasStackColor && trumpSuit != null) {
            var highestTrumpOnTable = gameCtx.cardsOnTable
                .filter(c => c.suit == trumpSuit)
                .sort((a, b) => b.points - a.points)[0] || null;

            var myBestTrump = hand
                .filter(c => c.suit === trumpSuit)
                .sort((a, b) => b.points - a.points)[0] || null;

            if (myBestTrump != null && highestTrumpOnTable != null && myBestTrump.points <= highestTrumpOnTable.points) {
                // Can't beat the highest trump on the table, but can play a lower trump or discard.
                return true;
            }
        }
        const hasTrump = hand.every(c => c.suit !== trumpSuit);
        console.debug("No same color or trump - can play any card", card.shortName, hasStackColor, hasTrump);
        return (hasStackColor && hasTrump) // nothing to play - can play any card
    }
