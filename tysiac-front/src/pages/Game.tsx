import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GameService from "../services/GameService";
import Lobby from "./Lobby";
import Table, { } from "./Table";
import type { ChatMessage, LobbyContext, Player, UpdateContext } from "./Models";
import MusicService from "../services/MusicService";
import { getCookie, userIdCookieName } from "../utils/Cookies";


const Game = () => {
    const navigate = useNavigate();
    const { gameCode } = useParams<{ gameCode: string }>();
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ nickname: "System", message: "Witaj w grze! Użyj czatu, aby komunikować się z innymi graczami." }]);
    const [showCode, setShowCode] = useState(false);
    const [inGame, setInGame] = useState(false);
    const [me, setMe] = useState<Player | null>(null);
    const [updateContext, setUpdateContext] = useState<UpdateContext | null>(null);
    const [lobbyContext, setLobbyContext] = useState<LobbyContext | null>(null);

    useEffect(() => {
        const connection = GameService.connection;

        if (!connection || connection.state === "Disconnected") {

            var localId = getCookie(userIdCookieName);

            if (localId) {
                console.debug("found localId", localId)
                //todo try to reconnect or joing lobby
            }
            navigate("/");
            return;
        }

        // Handle lobby updates
        const handleRoomUpdate = (lobbyCtx: LobbyContext) => {
            setLobbyContext(lobbyCtx);
            setMe(lobbyCtx.players.find(p => p.connectionId === connection.connectionId) || null);
            // localStorage.setItem("userId", me?.id || "");

        };

        const handleUpdate = (update: UpdateContext) => {
            setUpdateContext(update);
            //todo tutaj?
            // localStorage.setItem("userId", update.userContext.me.id);
            console.debug("Update context received:", update);
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

        connection.on("UpdateContext", handleUpdate); //update context
        connection.on("GameCreated", handleGameCreated); //game created
        connection.on("MessageRecieve", handleMessageReceive);//message receive
        connection.on("LobbyUpdate", handleRoomUpdate);//lobby update

        return () => {
            connection.off("UpdateContext", handleUpdate);
            connection.off("GameCreated", handleGameCreated);
            connection.off("MessageRecieve", handleMessageReceive);
            connection.off("LobbyUpdate", handleRoomUpdate);
        };
    }, []);
    useEffect(() => {
        MusicService.playBackgroundMusic();

        return () => {
            MusicService.stopBackgroundMusic();
        };
    }, []);

    const handleStartGame = () => {
        GameService.connection?.invoke("StartRoom", gameCode);
    };


    if (!inGame) {
        return <Lobby me={me} lobbyContext={lobbyContext} chatMessages={chatMessages} showCode={showCode} setShowCode={setShowCode} gameCode={gameCode!} onStartGame={handleStartGame} />;
    }
    else {
        return <Table chatMessages={chatMessages} gameCode={gameCode!} updateCtx={updateContext} />;
    }
}
export default Game;