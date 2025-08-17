import { useNavigate, useParams } from "react-router-dom";
import GameService from "../services/GameService";

import { ImExit } from "react-icons/im";
import React, { useState, useRef, useEffect } from "react";
import { FaCoins, FaStar } from "react-icons/fa";

import type { Card, ChatMessage, Player, UpdateContext } from "./Models";
import BetModal from "../components/modals/BetModal";
import IncreaseBetModal from "../components/modals/IncreaseBetModal";
import PlayerPosition from "../components/PlayerPosition";
import CardHand from "../components/CardHand";
import Options from "../components/Options";
import MusicService from "../services/MusicService";

import { canPlayCard, SUIT_ICONS } from "../utils/CardUtils";
import TrumpModal from "../components/modals/TrumpModal";
import EndGameModal from "../components/modals/EndGameModal";
import ScoreModal from "../components/modals/ScoreModal";
import PassInfo from "../components/PassInfo";
import ChatBox from "../components/modals/ChatBox";
import DisconnectedModal from "../components/modals/DisconnectedModal";
import OptionsButton from "../components/OptionButton";
import { useNotification } from "../utils/NotificationContext";

import TableCards from "../components/TableCards";
import Timer from "../components/Timer";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { DnDTypes } from "../utils/DndTypes";
import TableCardsDropZone from "../components/TableCardsDropZone";


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
    const [canPlayCardMap, setCanPlayCardMap] = useState<Map<string, boolean>>(new Map());

    useEffect(() => {
        console.debug("Table component mounted, gameCode:", gameCode);
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

    //Card droping logic
    const handleDropOnPlayer = (targetPlayerConnectionId: string | undefined, cardShortName: string) => {
        if (!targetPlayerConnectionId) {
            console.error("Invalid target player connection id")
            notify({
                message: "Nie udało się przekazać karty. Spróbuj ponownie.",
                type: "error"
            });
            return;
        }

        if (gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(targetPlayerConnectionId)) {
            GameService.connection?.invoke("GiveCard", gameCode, cardShortName, targetPlayerConnectionId)
                .catch(err => {
                    console.error("Error giving card:", err);
                    notify({
                        message: "Nie udało się przekazać karty. Spróbuj ponownie.",
                        type: "error"
                    });
                });
            setPlayersGivenCard(prev => [...prev, targetPlayerConnectionId]);
        }
    };

    const handleDropOnTable = (card: Card | undefined) => {

        if (!card) {
            console.error("Niepoprawna referencja karty! Skontaktuj się z administratorem!", card)
            notify(
                {
                    message: "Niepoprawna referencja karty! Skontaktuj się z administratorem!",
                    type: "error"
                }
            )
            return;
        }
        if (gameUserCtx && gameCtx?.gamePhase === 3 && isCurrentPlayer) {
            if (canPlayCard(card, gameCtx, gameUserCtx)) {
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
    };
    const sensors = useSensors(
        useSensor(TouchSensor),
        useSensor(MouseSensor)
      );
    const handleCardDrop = (event: DragEndEvent) => {
        if (event.over) {
            const targetId = event.over.id as string;
            if (targetId == DnDTypes.TABLE) {
                console.debug("Droped on the table", event.active);
                if (event.active.data.current && event.active.data.current.card) {
                    handleDropOnTable(event.active.data.current.card);
                } else {
                    console.error("Dragged card data is undefined!", event.active.data.current);
                }
            }
            else if (targetId.includes(DnDTypes.TABLE_PLAYER)) {
                let targetPlayerConnectionId: string | undefined = undefined;
                if (event.over.data.current) {
                    targetPlayerConnectionId = (event.over.data.current.player as Player).connectionId;
                    const card = event.active.id as string;
                    console.debug("Droped on player ", event.active, targetPlayerConnectionId);
                    handleDropOnPlayer(targetPlayerConnectionId, card);
                } else {
                    console.error("Dragged player data is undefined!", event.over.data.current);
                }
            }
        }
    }
    // END: Handle card drag and drop
    const firstPlayerInCurrentTake = useRef<string>(gameUserCtx?.me.connectionId || "");
    useEffect(() => {
        if (gameCtx && gameCtx.cardsOnTable && gameCtx.cardsOnTable.length === 0 && gameCtx.currentPlayer) {
            firstPlayerInCurrentTake.current = gameCtx.currentPlayer.connectionId;
        }
        if (gameCtx && gameUserCtx) {
            const playableCards = new Map<string, boolean>();
            gameUserCtx.hand.forEach(card => {
                const isPlayable = canPlayCard(card, gameCtx, gameUserCtx);
                playableCards.set(card.shortName, isPlayable);
            });
            setCanPlayCardMap(playableCards);
        }
    }, [gameCtx?.cardsOnTable, gameCtx?.currentPlayer]);

    // Modal for disconnected players
    const showDisconnectedModal = !!(gameCtx && gameCtx.disconnectedPlayers?.length > 0);

    return (
        <>
            <OptionsButton showOptions={() => setShowOptions(true)} />
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
            {/* Main surface */}
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-gray-900 to-blue-950 pt-3 pb-3">
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
                            <Timer />
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
                            <DndContext sensors={sensors} onDragEnd={handleCardDrop}>
                                {/* Players around the table (without current user's hand) */}
                                <PlayerPosition
                                    player={gameUserCtx?.teammate}
                                    position="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2"
                                    cardCount={gameUserCtx?.teammateCards}
                                    cardDirection="normal"
                                    highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.teammate?.connectionId}
                                    hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.teammate?.connectionId)}
                                    isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.teammate?.connectionId}
                                    isDropTargetActive={gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.teammate?.connectionId || '')}
                                />
                                <PlayerPosition
                                    player={gameUserCtx?.leftPlayer}
                                    position="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2"
                                    cardCount={gameUserCtx?.leftPlayerCards}
                                    cardDirection="left"
                                    highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.leftPlayer?.connectionId}
                                    hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.leftPlayer?.connectionId)}
                                    isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.leftPlayer?.connectionId}
                                    isDropTargetActive={gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.leftPlayer?.connectionId || '')}
                                />
                                <PlayerPosition
                                    player={gameUserCtx?.rightPlayer}
                                    position="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2"
                                    cardCount={gameUserCtx?.rightPlayerCards}
                                    cardDirection="right"
                                    highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.rightPlayer?.connectionId}
                                    hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.rightPlayer?.connectionId)}
                                    isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.rightPlayer?.connectionId}
                                    isDropTargetActive={gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.rightPlayer?.connectionId || '')}
                                />
                                {/* Cards on table (center) */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                                    {/* Drop Zone for playing cards */}
                                    <TableCardsDropZone
                                        allowDroping={gameCtx?.gamePhase === 3 && isCurrentPlayer}
                                    />
                                    <TableCards
                                        gameCtx={gameCtx}
                                        gameUserCtx={gameUserCtx}
                                        firstPlayerInCurrentTake={firstPlayerInCurrentTake}
                                    />
                                </div>
                                {/* Card Hand */}
                                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full flex justify-center">
                                    <CardHand
                                        cards={gameUserCtx?.hand || []}
                                        disabled={!isCurrentPlayer || ![1, 2, 3, 5].includes(gameCtx?.gamePhase ?? -1) || gameCtx?.gamePhase === 5} // Cards are draggable if phase 2 or 3 and current player
                                        playableCards={canPlayCardMap}
                                    />
                                </div>
                            </DndContext>
                        </div>
                    </div>
                </div>
                <Options isOpen={showOptions} onClose={() => setShowOptions(false)} />
            </div>
        </>
    );
};

export default Table;
