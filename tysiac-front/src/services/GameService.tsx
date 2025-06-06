import * as signalR from "@microsoft/signalr"

const url = import.meta.env.VITE_BACKEND_URL
if (!url) {
    throw new Error("BACKEND_URL is not defined");
}

export const GameService = {

    connection: null as signalR.HubConnection | null,
    constructor() {
        if (this.connection &&
            (this.connection.state === signalR.HubConnectionState.Connected ||
                this.connection.state === signalR.HubConnectionState.Connecting ||
                this.connection.state === signalR.HubConnectionState.Reconnecting)) {
            // Already connected or connecting, do nothing
            return;
        }
        if (!this.connection) {
            const userId = localStorage.getItem('userId');
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(userId ? `${url}/gameHub?userId=${userId}` : `${url}/gameHub`)
                .withAutomaticReconnect()
                .build();
            this.connection = connection;
        }
    }
    ,
    getConnectionState: function () {
        if (this.connection) {
            return this.connection.state;
        }
        return signalR.HubConnectionState.Disconnected;
    }
    ,
    startConnection: async function () {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Disconnected) {
            await this.connection.start()
        }
    },
    stopConnection: async function () {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            await this.connection.stop();
        }
    },
    joinRoom: async function (roomCode: string, nickname: string) {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke("JoinRoom", roomCode, nickname)
        } else {
            console.error(" Connection is not established or is disconnected.");
        }
    },
    createRoom: async function (nickname: string) {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke("CreateRoom", nickname)
                .catch(err => {
                    console.error("Error creating room:", err);
                }
                );
        } else {
            console.error(" Connection is not established or is disconnected.");
        }
    },
    onRoomCreated: function (callback: (roomCode: string) => void) {
        if (this.connection) {
            this.connection.on("RoomCreated", (roomCode: string) => {
                callback(roomCode);
            });
        }
        else {
            console.error("Connection is not established or is disconnected.");
        }
    },
    offRoomCreated: function () {
        if (this.connection) {
            this.connection.off("RoomCreated");
        }
    },
    onRoomJoined: function (callback: (roomCode: string) => void) {
        if (this.connection) {
            this.connection.on("RoomJoined", (roomCode: string) => {
                callback(roomCode);
            });
        }
        else {
            console.error("Connection is not established or is disconnected.");
        }
    },
    offRoomJoined: function () {
        if (this.connection) {
            this.connection.off("RoomJoined");
        }
    }
};
export default GameService;