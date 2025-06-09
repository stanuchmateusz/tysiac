using System.Text;
using GameServer.Models;
using GameServer.Models.Context;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Services;

public class LobbyService
{
    private readonly Dictionary<string,LobbyContext> _lobbies = new();
    
    public string CreateRoom(IPlayer player)
    {
        var roomCode = GenerateRoomCode();
        var lobbyContext = new LobbyContext(player, roomCode);
        _lobbies.Add(roomCode,lobbyContext);
        return roomCode;
    }
    
    public void JoinRoom(string roomCode, IPlayer player)
    {
        var lobby = GetRoom(roomCode);
   
        if (!AddPlayer(lobby,player) )
            throw new HubException("Room is full");
    }
    
    /// <summary>
    ///  Removes player with provided connectionId from lobby
    /// </summary>
    /// <param name="roomCode">room code</param>
    /// <param name="contextConnectionId">connection id of player</param>
    /// <returns>true if the room was disposed</returns>
    public bool LeaveRoom(string roomCode,string contextConnectionId)
    {
        var lobbyContext = GetRoom(roomCode);
      
        var player = GetPlayerFromRoom(lobbyContext, contextConnectionId);
        
        RemovePlayer(lobbyContext,player);
        
        if (lobbyContext.Players.Count == 0)
        {
            _lobbies.Remove(roomCode);
            return true;
        }
        
        return false;
    }
    public static bool AddToTeam1(LobbyContext lobby,IPlayer player)
    {
        if (lobby.Team1.Count == 2 || lobby.Team1.Contains(player))
            return false;
        lobby.Team2.Remove(player);
        lobby.Team1.Add(player);
        return true;
    }

    public static bool AddToTeam2(LobbyContext lobby,IPlayer player)
    {
        if (lobby.Team2.Count == 2 || lobby.Team2.Contains(player))
            return false;
        lobby.Team1.Remove(player);
        lobby.Team2.Add(player);
        return true;
    }
    
    public static bool AddPlayer(LobbyContext lobby, IPlayer player)
    {
        if (lobby.Players.Count  == 4)
        {
            return false;
        }
        lobby.Players.Add(player);
        return true;
    }

    public static void RemovePlayer(LobbyContext lobby, IPlayer player)
    {
        lobby.Team1.Remove(player);
        lobby.Team2.Remove(player);
        
        lobby.Players.Remove(player);
        if (lobby.Host.Id == player.Id && lobby.Players.Count > 0)
        {
           lobby.Host = lobby.Players[0]; // Promote the first player as the new host
        }
    }
    
    public static IPlayer GetPlayerFromRoom(LobbyContext lobbyContext, string contextConnectionId)
    {
        var player = lobbyContext.Players.FirstOrDefault(p => p.ConnectionId == contextConnectionId);
        if (player == null)
            throw new HubException("Player not found");
        return player;
    }
    
    public IPlayer GetPlayerFromRoom(string roomCode, string contextConnectionId)
    {
        var lobbyContext = GetRoom(roomCode);
      
        return GetPlayerFromRoom(lobbyContext, contextConnectionId);
    }
    
    public LobbyContext GetRoom(string roomCode)
    {
        var room = _lobbies!.GetValueOrDefault(roomCode, null);
        if (room == null)
            throw new HubException("Room not found");
        return room;
    }
    
    public void LeaveTeam(LobbyContext lobby, IPlayer player)
    {
        lobby.Team1.Remove(player);
        lobby.Team2.Remove(player);
    }

    public void LeaveTeam(string roomCode, IPlayer player)
    {
        var lobby = GetRoom(roomCode);
        if (lobby == null)
            throw new HubException("Room not found");
        LeaveTeam(lobby, player);
    }
    private static string GenerateRoomCode()
    {
        var random = new Random();
        const string validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var roomCode = new StringBuilder();
        while (roomCode.Length < 8)
            roomCode.Append(validChars[random.Next(validChars.Length)]);
        return roomCode.ToString();
    }
}