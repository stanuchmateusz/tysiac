import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GameService from "../services/GameService";
import { GrHide } from "react-icons/gr";
import { GrView } from "react-icons/gr";
import { ImExit } from "react-icons/im";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdSend } from "react-icons/io";
import Lobby from "./Lobby";
import Table, { type GameTableContext } from "./Table";

interface Player {
    connectionId: string;
    nickname: string;
}
interface ChatMessage {
    nickname: string;
    message: string;
}

interface TableContext {
    players: Player[];
    team1: Player[];
    team2: Player[];
    code: string;
}

const JoinTeamHandler = (isTeam1: boolean, gameCode: string) => {
    GameService.connection?.invoke("JoinTeam", gameCode, isTeam1)
        .catch(err => {
            console.error(`Error joining team:`, err);
        });
}

const Game = () => {
    const { gameCode } = useParams<{ gameCode: string }>();
    const [users, setUsers] = useState<Player[]>([]);
    const [team1, setTeam1] = useState<Player[]>([]);
    const [team2, setTeam2] = useState<Player[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ nickname: "System", message: "Witaj w grze! Użyj czatu, aby komunikować się z innymi graczami." }]);
    const [showCode, setShowCode] = useState(false);
    const [inGame, setInGame] = useState(false);
    const [gameTableContext, setGameTableContext] = useState<GameTableContext | null>(null);
    useEffect(() => {
        const connection = GameService.connection;
        if (!connection) return;

        const handleRoomUpdate = (ctx: TableContext) => {
            setUsers(ctx.players);
            setTeam1(ctx.team1);
            setTeam2(ctx.team2);
        };
        const handleGameTableUpdate = (ctx: GameTableContext) => {
            //todo: handle table update logic
            setGameTableContext(ctx);
            console.log("Game table context updated:", ctx);
        }
        const handleMessageReceive = (message: ChatMessage) => {
            setChatMessages(prevMessages => [...prevMessages, message]);
        };
        const handleGameTableCreated = (created: boolean) => {
            console.log("Table created:", created);
            if (created) {
                setInGame(true);
            } else {
                console.error("Failed to create room.");
            }
        }

        connection.invoke("GetRoomContext", gameCode);

        connection.on("GetRoomContext", handleRoomUpdate);
        connection.on("GetTableContext", handleGameTableUpdate);
        connection.on("TableCreated", handleGameTableCreated);
        connection.on("MessageRecieve", handleMessageReceive);
        connection.on("RoomUpdate", handleRoomUpdate);

        return () => {
            connection.on("GetTableContext", handleGameTableUpdate);
            connection.off("TableCreated", handleGameTableCreated);
            connection.off("GetRoomContext", handleRoomUpdate);
            connection.off("MessageRecieve", handleMessageReceive);
            connection.off("RoomUpdate", handleRoomUpdate);
        };
    }, []);

    const handleStartGame = () => {
        GameService.connection?.invoke("StartRoom", gameCode);
    };


    if (!inGame) {
        return <Lobby users={users} team1={team1} team2={team2} chatMessages={chatMessages} showCode={showCode} setShowCode={setShowCode} gameCode={gameCode!} onStartGame={handleStartGame} />;
    } else {
        return <Table users={users} team1={team1} team2={team2} chatMessages={chatMessages} showCode={showCode} setShowCode={setShowCode} gameCode={gameCode!} tableContext={gameTableContext} />;
    }
}
export default Game;