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
        if (lobby == null)
            throw new HubException("Room not found");
        if (lobby.Players.Count == 4 )
            throw new HubException("Room is full");
        lobby.Players.Add(player);
    }

    public LobbyContext CloseLobby(string roomCode)
    {
        var lobby = GetRoom(roomCode);
        if (lobby == null)
            throw new HubException("Cannot close lobby, room not found");
        _lobbies.Remove(roomCode);
        return lobby;
    }
    
    public bool LeaveRoom(string roomCode,string contextConnectionId)
    {
        var lobbyContext =  GetRoom(roomCode);
        if (lobbyContext == null)
            throw new HubException("Room not found");
        var player = lobbyContext.Players.FirstOrDefault(p => p.ConnectionId == contextConnectionId);
        if (player == null)
            throw new HubException("Player not found");
        lobbyContext.Players.Remove(player);
        if (lobbyContext.Players.Count == 0)
            _lobbies.Remove(roomCode);
        return true;
    }
    public bool AddToTeam1(IPlayer player, LobbyContext lobby)
    {
        if (lobby.Team1.Count == 2 || lobby.Team1.Contains(player))
            return false;
        lobby.Team2.Remove(player);
        lobby.Team1.Add(player);
        return true;
    }

    public bool AddToTeam2(IPlayer player, LobbyContext lobby)
    {
        if (lobby.Team2.Count == 2 || lobby.Team2.Contains(player))
            return false;
        lobby.Team1.Remove(player);
        lobby.Team2.Add(player);
        return true;
    }
    
    public bool AddPlayer(IPlayer player, LobbyContext lobby)
    {
        if (lobby.Players.Count  == 4)
        {
            return false;
        }
        lobby.Players.Add(player);
        return true;
    }

    public bool RemovePlayer(IPlayer player,LobbyContext lobby)
    {
        lobby.Team1.Remove(player);
        lobby.Team2.Remove(player);
        return lobby.Players.Remove(player);
    }
    
    public IPlayer GetPlayerFromRoom(LobbyContext lobbyContext, string contextConnectionId)
    {
        var player = lobbyContext.Players.FirstOrDefault(p => p.ConnectionId == contextConnectionId);
        if (player == null)
            throw new HubException("Player not found");
        return player;
    }
    public IPlayer GetPlayerFromRoom(string roomCode, string contextConnectionId)
    {
        var lobbyContext =  GetRoom(roomCode);
        if (lobbyContext == null)
            throw new HubException("Room not found");
        return GetPlayerFromRoom(lobbyContext, contextConnectionId);
    }
    public LobbyContext? GetRoom(string roomCode)
    {
        return _lobbies!.GetValueOrDefault(roomCode, null);
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