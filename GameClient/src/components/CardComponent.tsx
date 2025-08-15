import React, { useEffect, useState } from "react";
import { cardSizeCookieName, deckSkinCookieName, getCookie } from "../utils/Cookies";

import { CARD_RANKS, SUIT_ICONS } from "../utils/CardUtils";
import type { Card } from "../pages/Models";

interface CardProps {
    card: Card;
    style?: React.CSSProperties;
    cardSizeRecord?: Record<string, string>;
}
const CARD_SVG_PATH = import.meta.env.VITE_ASSETS_PATH || "/public/assets/default/";

const CardComponent: React.FC<CardProps> = ({ card, style, cardSizeRecord }) => {
    
    const cardSizeCookieValue = getCookie(cardSizeCookieName) || 'm';
    const deckSkinCookieValue = getCookie(deckSkinCookieName) || 'default';
    const [cardSize, setCardSize] = useState(cardSizeCookieValue);
    const [deckSkin, setDeckSkin] = useState(deckSkinCookieValue);
    const cardPath = `${CARD_SVG_PATH}${deckSkin != "default" ? "custom/" : ""}${deckSkin}/${card.shortName}.svg?v=${deckSkin}`; //?v to force reload on skin change
    
    const CARD_SIZE: Record<string, string> = cardSizeRecord ||
    {
        "xs": "w-12 h-17",
        "s": "w-14 h-20",
        "m": "w-16 h-24",
        "l": "w-22 h-32",
        "xl": "w-24 h-34",
        "xxl": "w-28 h-40",
        "xxxl": "w-32 h-44"
    };

    useEffect(() => {
        setCardSize(cardSizeCookieValue);
        setDeckSkin(deckSkinCookieValue);
        console.debug(`CardComponent: cardSize set to ${cardSizeCookieValue}, deckSkin set to ${deckSkinCookieValue}`);
    }, [getCookie(deckSkinCookieName), getCookie(cardSizeCookieName)]);

    const cardStyle = () => {
        return CARD_SIZE[cardSize] || CARD_SIZE['m']; // Default to 'm' if not found
    }
    return <img
        src={cardPath} //?v to force reload on skin change
        alt={`${CARD_RANKS[card.rank]} ${SUIT_ICONS[card.suit]}`}
        style={style}
        className={`${cardStyle()} drop-shadow-lg rounded-md`}
    />;
};

export default CardComponent;