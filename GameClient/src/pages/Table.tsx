import { useNavigate, useParams } from "react-router-dom";
import GameService from "../services/GameService";

import { ImExit } from "react-icons/im";
import React, { useState, useRef, useEffect } from "react";
import { FaCoins, FaStar } from "react-icons/fa";

import type { Card, ChatMessage, UpdateContext } from "./Models";
import BetModal from "../components/modals/BetModal";
import IncreaseBetModal from "../components/modals/IncreaseBetModal";
import PlayerPosition from "../components/PlayerPosition";
import CardHand from "../components/CardHand";
import Options from "../components/Options";
import MusicService from "../services/MusicService";
import { cardSizeCookieName, deckSkinCookieName, getCookie } from "../utils/Cookies";
import { SUIT_ICONS } from "../utils/CardConsts";
import TrumpModal from "../components/modals/TrumpModal";
import EndGameModal from "../components/modals/EndGameModal";
import ScoreModal from "../components/modals/ScoreModal";
import PassInfo from "../components/PassInfo";
import ChatBox from "../components/modals/ChatBox";
import DisconnectedModal from "../components/modals/DisconnectedModal";
import OptionsButton from "../components/OptionButton";
import { useNotification } from "../utils/NotificationContext";

const CookieSkin = getCookie(deckSkinCookieName)
const CARD_ASSETS_PATH = (CookieSkin === 'default' || CookieSkin === null) ? 'default' : "custom/" + CookieSkin
export const CARD_SVG_PATH = import.meta.env.VITE_ASSETS_PATH + `${CARD_ASSETS_PATH}/` || "/public/assets/default/";


const GAME_STAGES: Record<number, string> = {
    0: "Start",
    1: "Auction",
    2: "Card Distribution",
    3: "Playing",
    4: "End",
    5: "ShowTable",
    6: "Increase Bet",
    999: "undefined"
}

const Table = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [message, setMessage] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [updateCtx, setUpdateContext] = useState<UpdateContext | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ nickname: "System", message: "Witaj w grze! Użyj czatu, aby komunikować się z innymi graczami." }]);
    const { gameCode } = useParams<{ gameCode: string }>();

    const [timer, setTimer] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Start timer on mount
        timerRef.current = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);

        // Cleanup on unmount
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    function formatTime(seconds: number) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
        const ss = String(seconds % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    useEffect(() => {
        const connection = GameService.connection;

        if (!connection || connection.state === "Disconnected") {

            navigate("/join/" + gameCode, { replace: true });
            return
        }

        //Handle updates of context
        const handleUpdate = (update: UpdateContext) => {
            setUpdateContext(update);
            console.debug("Update context received:", update);
        }

        // Handle incoming chat messages
        const handleMessageReceive = (message: ChatMessage) => {
            setChatMessages(prevMessages => [...prevMessages, message]);
            if (!showChat) setHasNewMessage(true);
        };

        connection.on("UpdateContext", handleUpdate);
        connection.on("MessageRecieve", handleMessageReceive);

        //Get game ctx -> backend returns UpdateContext
        if (connection.state === "Connected") {
            connection.invoke("GetGameContext", gameCode)
                .catch(err => {
                    console.error("Error fetching game context:", err);
                    notify({
                        message: "Nie udało się pobrać kontekstu gry. Spróbuj ponownie.",
                        type: "error"
                    });
                });
        }

        return () => {
            connection.off("UpdateContext", handleUpdate);
            connection.off("MessageRecieve", handleMessageReceive);
        };

    }, [GameService.connection]);

    const gameCtx = updateCtx?.gameCtx;
    const gameUserCtx = updateCtx?.userCtx || null;
    const minBet = (gameCtx?.currentBet ?? 100) + 10;
    const maxBet = 400;
    const [bet, setBet] = useState(minBet);

    //debugging
    useEffect(() => {
        console.debug(
            "Table rendered with gameCtx:", gameCtx,
            "gameUserCtx:", gameUserCtx);
    }, [gameCtx, gameUserCtx]);

    const isCurrentPlayer = gameCtx?.currentPlayer.connectionId === GameService.connection?.connectionId;

    //sound logic
    useEffect(() => {
        if (isCurrentPlayer) {
            MusicService.playBell();
        }
    }, [isCurrentPlayer]);

    useEffect(() => {
        MusicService.playPlaceCard();
    }, [gameCtx?.cardsOnTable]);

    useEffect(() => {
        setBet(minBet);
    }, [minBet]);

    // Reset playersGivenCard when gamePhase changes to Card Distribution (2)
    useEffect(() => {
        if (gameCtx?.gamePhase === 2) {
            setPlayersGivenCard([]);
        }
        console.log("Game phase:", GAME_STAGES[gameCtx?.gamePhase ?? 999])
        if (gameCtx?.gamePhase === 4) { //end game
            setShowEndGameModal(true);
        }
    }, [gameCtx?.gamePhase]);

    const [playersGivenCard, setPlayersGivenCard] = useState<string[]>([]); // For tracking players to whom cards have been given in Game Phase 2

    // Modal for showing trump suit
    const [showTrumpModal, setShowTrumpModal] = useState(false);
    const prevTrumpSuit = useRef<number | null>(null);
    const trumpTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (gameCtx && gameCtx.trumpSuit && prevTrumpSuit.current !== null && gameCtx.trumpSuit !== prevTrumpSuit.current) {
            setShowTrumpModal(true);
            MusicService.playMeld();
            if (trumpTimeout.current) clearTimeout(trumpTimeout.current);
            trumpTimeout.current = setTimeout(() => setShowTrumpModal(false), 1000);
        }
        if (gameCtx) prevTrumpSuit.current = gameCtx.trumpSuit;
    }, [gameCtx?.trumpSuit]);
    // END: Modal for showing trump suit

    // Function to send a chat message
    const sendMessage = () => {
        if (message.trim() && message.length > 0 && message.length <= 512) {
            GameService.connection?.invoke("SendMessage", gameCode, message)
                .catch(err => {
                    console.error("Error sending message:", err)
                    notify({
                        message: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
                        type: "error"
                    });
                });
            setMessage("");
        } else {
            notify({
                message: "Wiadomość musi mieć od 1 do 512 znaków.",
                type: "error"
            });
        }
    };
    // Handle Enter key press to send message
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    // Functions to raise or lower the bet
    const handleRaise = () => setBet(bet + 10);
    const handleLower = () => setBet(bet > minBet ? bet - 10 : bet);

    // Function to pass the current bid
    const handlePass = () => {
        GameService.connection?.invoke("PassBid", gameCode)
            .catch(err => {
                console.error("Error passing bid:", err)
                notify({
                    message: "Nie udało się przekazać zakładu. Spróbuj ponownie.",
                    type: "error"
                });
            });
    };
    // Function to accept the current bet
    const handleAccept = () => {
        GameService.connection?.invoke("PlaceBid", gameCode, bet)
            .catch(err => {
                console.error("Error placing bid:", err)
                notify({
                    message: "Nie udało się zaakceptować zakładu. Spróbuj ponownie.",
                    type: "error"
                });
            });
    };

    const handleLeaveRoom = () => {
        GameService.connection?.invoke("LeaveGame", gameCode) //ignore errors, just leave
        navigate("/", { replace: true })
    }

    // Handle card drag and drop
    const [isDraggingCard, setIsDraggingCard] = useState(false);
    const [draggedCardData, setDraggedCardData] = useState<Card | null>(null);

    const handleCardDragStart = (event: React.DragEvent, card: Card) => {
        event.dataTransfer.setData("application/json", JSON.stringify(card));
        event.dataTransfer.effectAllowed = "move";
        setDraggedCardData(card);
        setIsDraggingCard(true);
    };

    const handleCardDragEnd = () => {
        setIsDraggingCard(false);
        setDraggedCardData(null);
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDropOnPlayer = (event: React.DragEvent, targetPlayerConnectionId: string | undefined) => {
        event.preventDefault();
        if (!targetPlayerConnectionId || !draggedCardData) {
            setIsDraggingCard(false);
            setDraggedCardData(null);
            return;
        }

        if (gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(targetPlayerConnectionId)) {
            GameService.connection?.invoke("GiveCard", gameCode, draggedCardData.shortName, targetPlayerConnectionId)
                .catch(err => {
                    console.error("Error giving card:", err);
                    notify({
                        message: "Nie udało się przekazać karty. Spróbuj ponownie.",
                        type: "error"
                    });
                });
            setPlayersGivenCard(prev => [...prev, targetPlayerConnectionId]);
        }
        setIsDraggingCard(false);
        setDraggedCardData(null);
    };

    const handleDropOnTable = (event: React.DragEvent) => {
        event.preventDefault();
        if (!draggedCardData) {
            setIsDraggingCard(false);
            setDraggedCardData(null);
            return;
        }
        const card = draggedCardData;

        if (gameCtx?.gamePhase === 3 && isCurrentPlayer) {
            if (canPlayCard(card)) {
                GameService.connection?.invoke("PlayCard", gameCode, card.shortName)
                    .catch(err => {
                        console.error("Error playing card:", err);
                        notify({
                            message: "Nie udało się zagrać kartą. Spróbuj ponownie.",
                            type: "error"
                        });
                    });
                MusicService.playPlaceCard();
            } else {
                console.warn("Cannot play this card by drag:", card.shortName);
            }
        }
        setIsDraggingCard(false);
        setDraggedCardData(null);
    };
    // END: Handle card drag and drop
    const firstPlayerInCurrentTake = useRef<string>(gameUserCtx?.me.connectionId || "");

    useEffect(() => {
        if (gameCtx && gameCtx.cardsOnTable && gameCtx.cardsOnTable.length === 0 && gameCtx.currentPlayer) {
            firstPlayerInCurrentTake.current = gameCtx.currentPlayer.connectionId;
        }
    }, [gameCtx?.cardsOnTable, gameCtx?.currentPlayer]);

    // (trumf serce) ja koniczyna 9 serce 10 serce ma jopka i nie ma do koloru - więc musi dać 
    function canPlayCard(card: Card): boolean {
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
    // Modal for disconnected players
    const showDisconnectedModal = !!(gameCtx && gameCtx.disconnectedPlayers?.length > 0);

    function renderCardsOnTheTable(): React.ReactNode {
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

                const CARD_SIZE: Record<string, string> = {
                    "xs": "w-12 h-17",
                    "s": "w-14 h-20",
                    "m": "w-16 h-24",
                    "l": "w-22 h-32",
                    "xl": "w-24 h-34",
                    "xxl": "w-28 h-40",
                    "xxxl": "w-32 h-44"
                };
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
                    <img
                        key={card.shortName + cardIndexInTrick}
                        src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                        alt={card.shortName}
                        style={style}
                        className={`drop-shadow-lg ${CARD_SIZE[cardSize] || CARD_SIZE['m']} rounded-md`}
                    />
                );
            });
        })();

    }

    return (
        <>
            <OptionsButton showOptions={() => setShowOptions(true)} />
            {/* Main surface */}
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-gray-900 to-blue-950 p-6">
                <DisconnectedModal
                    open={showDisconnectedModal}
                    disconnectedCount={gameCtx?.disconnectedPlayers.length ?? 0}
                    onLeave={handleLeaveRoom}
                />
                <EndGameModal
                    open={showEndGameModal}
                    gameUserCtx={gameUserCtx}
                    onLeave={handleLeaveRoom}
                />
                <ScoreModal
                    open={showScoreModal}
                    gameUserCtx={gameUserCtx}
                    onClose={() => setShowScoreModal(false)}
                />

                <div className={`w-full rounded-3xl shadow-2xl bg-gray-800/90 flex flex-col relative overflow-hidden border border-blue-900 ${showDisconnectedModal || showOptions ? 'pointer-events-none select-none opacity-60' : ''} flex-1`}>
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-blue-900/80 to-gray-900/80 gap-2">
                        <div className="flex flex-wrap gap-2 items-center justify-center">
                            <span className="flex items-center gap-1 bg-yellow-900/80 text-yellow-200 px-3 py-1.5 rounded-lg font-semibold shadow text-base">
                                <FaCoins className="text-yellow-400 text-lg" />
                                <span>Zakład:</span>
                                <span className="text-yellow-300 font-bold">{gameCtx?.currentBet ?? '-'}</span>
                            </span>
                            <span
                                className="flex items-center gap-1 bg-green-900/80 text-green-200 px-3 py-1.5 rounded-lg font-semibold shadow text-base"
                                title={gameCtx?.trumpSuit ? `Meldunek: ${gameCtx.trumpSuit}` : "Brak meldunku"}
                            >
                                <FaStar className="text-green-400 text-lg" />
                                <span>Meldunek:</span>
                                <span className="text-green-300 font-bold">{gameCtx?.trumpSuit ? SUIT_ICONS[gameCtx.trumpSuit] : '-'}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-gradient-to-r from-blue-700 to-blue-900 text-white px-3 py-1.5 rounded-lg font-bold shadow text-base">
                                MY:
                                <span className="text-blue-300 font-bold">{gameUserCtx?.myTeamScore[0] ?? 0}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-gradient-to-r from-pink-700 to-pink-900 text-white px-3 py-1.5 rounded-lg font-bold shadow text-base">
                                WY:
                                <span className="text-pink-300 font-bold">{gameUserCtx?.opponentScore[0] ?? 0}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 bg-gray-900/80 text-gray-200 px-3 py-1.5 rounded-lg font-semibold shadow text-base">
                                ⏱ <span>{formatTime(timer)}</span>
                            </span>
                            <button
                                onClick={handleLeaveRoom}
                                className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg font-semibold shadow flex items-center gap-2 transition-all duration-150 cursor-pointer"
                                aria-label="Wyjdź"
                            >
                                Wyjdź <ImExit />
                            </button>
                        </div>
                    </div>

                    {/* Main Table Area */}
                    <div className="w-full flex-1 flex">
                        {/* Table Area */}
                        <div className="flex-1 flex flex-col items-center justify-center relative p-4 sm:p-6 md:p-8">
                            {/* Chat on the left, fixed position */}
                            <ChatBox
                                showChat={showChat}
                                chatMessages={chatMessages}
                                message={message}
                                setMessage={setMessage}
                                handleKeyPress={handleKeyPress}
                                sendMessage={sendMessage}
                                setShowChat={setShowChat}
                                setHasNewMessage={setHasNewMessage}
                            />

                            {/* Floating show chat button, only if chat is hidden, bottom left */}
                            {!showChat && (
                                <div className="fixed left-8 bottom-8 z-30 flex flex-col gap-4">
                                    <button
                                        className={`px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-semibold shadow-lg border-2 border-blue-900 transition-all duration-150 opacity-90 cursor-pointer
                                         ${hasNewMessage ? 'animate-glow border-yellow-400 shadow-yellow-400/60' : ''}
                                     `}
                                        onClick={() => setShowChat(true)}
                                    >
                                        Pokaż chat
                                    </button>
                                    <button
                                        className="px-5 py-3 bg-gradient-to-r from-blue-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-semibold shadow-lg border-2 border-blue-900 transition-all duration-150 opacity-90 cursor-pointer"
                                        onClick={() => setShowScoreModal(true)}
                                    >
                                        Wyniki
                                    </button>
                                </div>
                            )}
                            {/* Players around the table (without current user's hand) */}
                            <PlayerPosition
                                player={gameUserCtx?.teammate}
                                position="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2"
                                cardCount={gameUserCtx?.teammateCards}
                                cardDirection="normal"
                                highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.teammate?.connectionId}
                                hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.teammate?.connectionId)}
                                isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.teammate?.connectionId}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnPlayer(e, gameUserCtx?.teammate?.connectionId)}
                                isDropTargetActive={isDraggingCard && gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.teammate?.connectionId || '')}
                            />
                            <PlayerPosition
                                player={gameUserCtx?.leftPlayer}
                                position="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2"
                                cardCount={gameUserCtx?.leftPlayerCards}
                                cardDirection="left"
                                highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.leftPlayer?.connectionId}
                                hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.leftPlayer?.connectionId)}
                                isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.leftPlayer?.connectionId}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnPlayer(e, gameUserCtx?.leftPlayer?.connectionId)}
                                isDropTargetActive={isDraggingCard && gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.leftPlayer?.connectionId || '')}
                            />
                            <PlayerPosition
                                player={gameUserCtx?.rightPlayer}
                                position="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2"
                                cardCount={gameUserCtx?.rightPlayerCards}
                                cardDirection="right"
                                highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.rightPlayer?.connectionId}
                                hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.rightPlayer?.connectionId)}
                                isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.rightPlayer?.connectionId}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnPlayer(e, gameUserCtx?.rightPlayer?.connectionId)}
                                isDropTargetActive={isDraggingCard && gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.rightPlayer?.connectionId || '')}
                            />
                            {/* Cards on table (center) */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                                {/* Drop Zone for playing cards */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDropOnTable}
                                    className={`absolute inset-0 m-auto w-1/2 h-1/2 border-2 border-dashed rounded-lg transition-all duration-150
                                            ${isDraggingCard && gameCtx?.gamePhase === 3 && isCurrentPlayer
                                            ? 'border-green-500 bg-green-700/30 backdrop-blur-sm'
                                            : 'border-transparent'}
                                        `}
                                    style={{
                                        pointerEvents: (isDraggingCard && gameCtx?.gamePhase === 3 && isCurrentPlayer) ? 'auto' : 'none',
                                        zIndex: 5 // Below cards on table, but catch drops
                                    }}
                                >
                                    {isDraggingCard && gameCtx?.gamePhase === 3 && isCurrentPlayer && (
                                        <span className="flex items-center justify-center h-full text-white/70 text-sm">Upuść tutaj</span>
                                    )}
                                </div>
                                {renderCardsOnTheTable()}
                            </div>
                            {/* Card Hand */}
                            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full flex justify-center">
                                <CardHand
                                    cards={gameUserCtx?.hand || []}
                                    onCardDragStart={handleCardDragStart}
                                    onCardDragEnd={handleCardDragEnd}
                                    disabled={!isCurrentPlayer || ![1, 2, 3, 5].includes(gameCtx?.gamePhase ?? -1) || gameCtx?.gamePhase === 5} // Cards are draggable if phase 2 or 3 and current player
                                    canPlayCard={canPlayCard}
                                />
                            </div>
                            <PassInfo
                                open={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.me?.connectionId)}
                            />
                            <BetModal
                                open={gameCtx?.gamePhase === 1 && isCurrentPlayer}
                                currentBet={bet}
                                onRaise={handleRaise}
                                onLower={handleLower}
                                onPass={handlePass}
                                onAccept={handleAccept}
                                minBet={minBet}
                                maxBet={maxBet}
                            />
                            <IncreaseBetModal
                                open={gameCtx?.gamePhase === 6 && isCurrentPlayer}
                                currentBet={bet}
                                onRaise={handleRaise}
                                onLower={handleLower}
                                onPass={handlePass}
                                minBet={minBet}
                                maxBet={maxBet}
                                onAccept={handleAccept}
                            />
                            <TrumpModal
                                open={showTrumpModal}
                                trumpSuit={gameCtx?.trumpSuit}
                            />

                        </div>
                    </div>
                </div>
                <Options isOpen={showOptions} onClose={() => setShowOptions(false)} />
            </div>
        </>
    );
};

export default Table;
