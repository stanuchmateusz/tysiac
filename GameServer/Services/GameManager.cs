using System.Collections.ObjectModel;
using System.Text;
using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.impl;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Primitives;
using Serilog;

namespace GameServer.Services;

public class GameManager
{
    private readonly Dictionary<string,GameService> _tables = new();

    /// <summary>
    /// Creates a new game instance based on the provided lobby context and adds it to the collection of active games.
    /// </summary>
    /// <param name="lobbyContext">The context of the lobby from which the game is being created.
    /// This typically includes player information and the unique room code.</param>
    public void CreateNewGame(LobbyContext lobbyContext)
    {
        var newGameService = new GameService(lobbyContext);
        _tables.Add(lobbyContext.Code,newGameService);
    }
    
    /// <summary>
    /// Retrieves the game service associated with the specified room code.
    /// </summary>
    /// <param name="roomCode">The code of the room (game table) to retrieve.</param>
    /// <returns>The <see cref="GameService"/> for the given room code, or <c>null</c> if no game service is found for that code.</returns>
    public GameService? GetRoom(string roomCode)
    {
        return _tables.GetValueOrDefault(roomCode);
    }
    
    /// <summary>
    /// Removes the game service (table) associated with the specified room code.
    /// Logs a warning if no room with the given code is found.
    /// </summary>
    /// <param name="roomCode">The code of the room (game table) to remove.</param>
    public void RemoveRoom(string roomCode)
    {
        if (!_tables.Remove(roomCode))
        {
            Log.Warning("Attempted to remove non-existing room with code: {RoomCode}", roomCode);
        }
    }
    
    /// <summary>
    /// Handles the disconnection of a player identified by their connection ID.
    /// Pauses any active games the player was part of. If, after a player's disconnection,
    /// a game room becomes empty (all players have left), that room is removed.
    /// </summary>
    /// <param name="contextConnectionId">The connection ID of the player who disconnected.</param>
    /// <returns>A list of <see cref="GameService"/> instances representing the games
    /// the disconnected player was actively participating in.</returns>
    /// <exception cref="InvalidOperationException">Thrown if a player, expected to be in a game,
    /// cannot be found when attempting to pause the game. This might indicate an inconsistent state.</exception>
    public List<GameService> Disconnect(string contextConnectionId)
    {
        var activeGamesWithUser = GetRoomsWithPlayerByConnectionId(contextConnectionId);
        
        foreach (var table in activeGamesWithUser)
        {
            var player = table.GetPlayerFromRoom(contextConnectionId);
            table.PauseGame(player ?? throw new InvalidOperationException("Player got removed from table!"));
            if (table.AllPlayersLeft()) continue;
            Log.Information("All players disconnected from room {RoomCode} - Removing the room", table.RoomCode);
            RemoveRoom(table.RoomCode);
        }

        return activeGamesWithUser;
    }
    
    /// <summary>
    /// Attempts to restore a player's connection to a game room using their user ID and new connection ID.
    /// If the user is found in one or more active games, their connection ID is updated in the first game found,
    /// and an attempt is made to resume that game for the player.
    /// </summary>
    /// <param name="connectionId">The new connection ID for the player.</param>
    /// <param name="userId">The unique ID of the user whose connection is to be restored.</param>
    /// <returns>The room code of the game where the connection was successfully restored and game resumption was attempted,
    /// or <c>null</c> if the user was not found in any active games or if the player object couldn't be retrieved within a found game.</returns>
    public string? TryToRestoreConnection(string connectionId, string userId)
    {
        var gameRoom = GetRoomsWithPlayerByUserId(userId);
        if (gameRoom.Count == 0)
        {
            Log.Debug("No rooms found for user {UserId}", userId);
            return null;
        }
        foreach (var room in gameRoom)
        {
            var player = room.Players.FirstOrDefault(p => p.Id == userId);
            if (player != null)
            {
                player.ConnectionId = connectionId; // Update the connection ID
                Log.Information("Restored connection for user {UserId} in room {RoomCode}", userId, room.RoomCode);
                room.TryResumeGame(player);
                return room.RoomCode;
            }
            Log.Warning("Player with userId {UserId} not found in room {RoomCode}", userId, room.RoomCode);
            
        }
        return null;
    }
    
    private List<GameService> GetRoomsWithPlayerByConnectionId(string contextConnectionId)
    {
        var tabServ = _tables.Values.Where(t => t.Players.Any(p => p.ConnectionId == contextConnectionId));
        return tabServ as List<GameService> ?? tabServ.ToList();
    }
    
    private List<GameService> GetRoomsWithPlayerByUserId(StringValues userId)
    {
        var tabServ = _tables.Values.Where(t => t.Players.Any(p => p.Id == userId));
        return tabServ as List<GameService> ?? tabServ.ToList();
    }
}