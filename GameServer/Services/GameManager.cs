using System.Collections.ObjectModel;
using System.Text;
using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.impl;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Primitives;

namespace GameServer.Services;

public class GameManager //: IGameManager
{
    private readonly Dictionary<string,GameService> _tables;
    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger<GameManager> _logger;

    public GameManager(ILoggerFactory loggerFactory)
    {
        _loggerFactory = loggerFactory;
        _logger = loggerFactory.CreateLogger<GameManager>();
        _tables = new Dictionary<string,GameService>();
    }

    public void CreateNewGame(LobbyContext lobbyContext)
    {
        var gameLogger = _loggerFactory.CreateLogger<GameService>();
        var newGameService = new GameService(lobbyContext,gameLogger);
        _tables.Add(lobbyContext.Code,newGameService);
    }
    
    public GameService? GetRoom(string roomCode)
    {
        return _tables.GetValueOrDefault(roomCode, null);
    }
    
    public void RemoveRoom(string roomCode)
    {
        if (!_tables.Remove(roomCode))
        {
            _logger.LogWarning("Attempted to remove non-existing room with code: {RoomCode}", roomCode);
        }
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
    
    public List<GameService> Disconnect(string contextConnectionId)
    {
        //find rooms with user 
        var tables = GetRoomsWithPlayerByConnectionId(contextConnectionId);
        
        foreach (var table in tables)
        {
            table.PauseGame();
            if (table.DisconnectedPlayersCount != 4) continue;
            _logger.LogInformation("All players disconnected from room {RoomCode} - Removing the room", table.RoomCode);
            RemoveRoom(table.RoomCode);
        }

        return tables;
    }
    
    public void TryToRestoreConnection(string connectionId, StringValues userId)
    {
        // Find all rooms where the user with this userId is present
        var gameRoom = GetRoomsWithPlayerByUserId(userId);
        if (gameRoom.Count == 0)
        {
            _logger.LogDebug("No rooms found for user {UserId}", userId);
            return;
        }
        foreach (var room in gameRoom)
        {
            var player = room.Players.FirstOrDefault(p => p.Id == userId);
            if (player != null)
            {
                player.ConnectionId = connectionId; // Update the connection ID
                _logger.LogInformation("Restored connection for user {UserId} in room {RoomCode}", userId, room.RoomCode);
                room.TryResumeGame();
            }
            else
            {
                _logger.LogWarning("Player with userId {UserId} not found in room {RoomCode}", userId, room.RoomCode);
            }
        }
    }
}