import { useState, useEffect } from "react";
import GameService from "../services/GameService";
import { useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";

const StartGame = () => {

    const [nickname, setNickname] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [roomError, setRoomError] = useState("");
    const [isReady, setIsReady] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {

        if (!GameService.connection || GameService.connection.state === signalR.HubConnectionState.Disconnected) {
            GameService.constructor()
            GameService.startConnection()
                .then(() => setIsReady(true))
                .catch(err => {
                    console.error("Błąd podczas nawiązywania połączenia:", err);
                    setIsReady(false);
                });
        }


        GameService.onRoomCreated((roomCode: string) => {
            navigate(`/game/${roomCode}`);
        });
        GameService.onRoomJoined((roomCode: string) => {
            navigate(`/game/${roomCode}`);
        });

        const ensureConnection = async () => {
            if (GameService.getConnectionState() !== window.signalR.HubConnectionState.Connected) {
                await GameService.startConnection();
            }
            setIsReady(true);
        };
        // Use the global signalR if available, otherwise fallback to 1
        if (window.signalR && window.signalR.HubConnectionState) {
            ensureConnection();
        } else {
            // fallback: check for string value
            if (GameService.getConnectionState() !== 'Connected') {
                GameService.startConnection().then(() => setIsReady(true));
            } else {
                setIsReady(true);
            }
        }
        return () => {
            GameService.offRoomCreated();
            GameService.offRoomJoined();
        };
    }, [navigate]);

    const handleHostGame = async () => {

        if (!validateNickname(nickname)) {
            console.error("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            return;
        }
        if (!isReady) {
            console.warn("Połączenie nie jest jeszcze gotowe.");
            return;
        }
        GameService.createRoom(nickname)
            .catch(err => {
                console.error("Błąd podczas tworzenia pokoju:", err);
            });

    }

    const handleJoinGame = async () => {
        // Logika do obsługi dołączania do pokoju gry
        if (!validateNickname(nickname)) {
            console.error("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            setRoomError("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            return;
        }
        if (!validateRoomCode(roomCode)) {
            console.error("Nieprawidłowy kod pokoju. Upewnij się, że ma 8 znaków i zawiera tylko wielkie litery i cyfry.");
            setRoomError("Nieprawidłowy kod pokoju. Upewnij się, że ma 8 znaków i zawiera tylko wielkie litery i cyfry.");
            return;
        }
        if (!isReady) {
            console.warn("Połączenie nie jest jeszcze gotowe.");
            setRoomError("Połączenie nie jest jeszcze gotowe.");
            return;
        }
        GameService.joinRoom(roomCode, nickname)
            .catch(err => {
                console.error("Błąd podczas dołączania do pokoju:", err);
                setRoomError("Błąd podczas dołączania do pokoju. Upewnij się, że kod pokoju jest poprawny.");
            });
    }

    const validateNickname = (nickname: string) => {
        return nickname.length >= 3 && nickname.length <= 20 && /^[a-zA-Z0-9_]+$/.test(nickname);
    }
    const validateRoomCode = (roomCode: string) => {
        return roomCode.length === 8 && /^[A-Z0-9]{8}$/.test(roomCode);
    }

    return (
        <div className="flex flex-col items-center justify-center w-full gap-4">
            <div className="flex flex-col gap-4 w-full max-w-md bg-gray-800/90 rounded-2xl shadow-xl px-8 py-8">
                <input
                    type="text"
                    placeholder="Twój pseudonim..."
                    className="p-3 border border-gray-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                />
                <button
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md transition-all duration-150 cursor-pointer text-lg w-full"
                    onClick={handleHostGame}
                >
                    Zostań gospodarzem
                </button>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <input
                        type="text"
                        placeholder="Kod pokoju..."
                        className="flex-1 p-3 border border-gray-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-w-0"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value)}
                    />
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-lg font-semibold shadow-md transition-all duration-150 cursor-pointer text-lg w-full sm:w-auto"
                        onClick={handleJoinGame}
                    >
                        Dołącz do gry
                    </button>
                </div>
                {roomError && <p className="text-red-500 mt-2 text-center">{roomError}</p>}
            </div>
        </div>
    );
}
export default StartGame;