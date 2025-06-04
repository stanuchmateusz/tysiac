import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GameService from "../services/GameService";

import Lobby from "./Lobby";
import Table, { type GameContext as GameContext, type GameUserContext } from "./Table";

export interface Player {
    connectionId: string;
    nickname: string;
}
export interface ChatMessage {
    nickname: string;
    message: string;
}

export interface LobbyContext {
    players: Player[];
    team1: Player[];
    team2: Player[];
    code: string;
}

const Game = () => {
    const navigate = useNavigate();
    const { gameCode } = useParams<{ gameCode: string }>();
    const [users, setUsers] = useState<Player[]>([]);
    const [team1, setTeam1] = useState<Player[]>([]);
    const [team2, setTeam2] = useState<Player[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ nickname: "System", message: "Witaj w grze! Użyj czatu, aby komunikować się z innymi graczami." }]);
    const [showCode, setShowCode] = useState(false);
    const [inGame, setInGame] = useState(false);
    const [gameContext, setGameContext] = useState<GameContext | null>(null);
    const [gameUserContext, setGameUserContext] = useState<GameUserContext | null>(null);
    useEffect(() => {
        const connection = GameService.connection;
        if (!connection || connection.state === "Disconnected") {
            navigate("/");
            return;
        }

        // Handle lobby updates
        const handleRoomUpdate = (lobbyCtx: LobbyContext) => {
            setUsers(lobbyCtx.players);
            setTeam1(lobbyCtx.team1);
            setTeam2(lobbyCtx.team2);
        };


        const handleGameContextUpdate = (ctx: GameContext) => {
            setGameContext(ctx);
            console.log("Game table context updated:", ctx);

        }
        const handleGameUserContextUpdate = (ctx: GameUserContext) => {
            //todo 
            setGameUserContext(ctx);
            console.log("Game user context updated:", ctx);
        }

        // Handle incoming chat messages
        const handleMessageReceive = (message: ChatMessage) => {
            setChatMessages(prevMessages => [...prevMessages, message]);
        };

        // Finish lobby start the game
        const handleGameCreated = () => {
            console.log("New game created");
            setInGame(true);
        }

        connection.invoke("GetLobbyContext", gameCode); //request lobby context


        connection.on("GameContextUpdate", handleGameContextUpdate); //game update
        connection.on("GameUserContextUpdate", handleGameUserContextUpdate); //game user update
        connection.on("GameCreated", handleGameCreated); //game created
        connection.on("MessageRecieve", handleMessageReceive);//message receive
        connection.on("LobbyUpdate", handleRoomUpdate);//lobby update

        return () => {
            connection.off("GameContextUpdate", handleGameContextUpdate);
            connection.off("GameCreated", handleGameCreated);
            connection.off("MessageRecieve", handleMessageReceive);
            connection.off("LobbyUpdate", handleRoomUpdate);
        };
    }, []);

    const handleStartGame = () => {
        GameService.connection?.invoke("StartRoom", gameCode);
    };


    if (!inGame) {
        return <Lobby users={users} team1={team1} team2={team2} chatMessages={chatMessages} showCode={showCode} setShowCode={setShowCode} gameCode={gameCode!} onStartGame={handleStartGame} />;
    } else {
        return <Table chatMessages={chatMessages} gameCode={gameCode!} gameCtx={gameContext} gameUserCtx={gameUserContext} />;
    }
}
export default Game;