using System.Text;
using GameServer.Models;
using GameServer.Models.Context;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Services;

public class LobbyManager
{
    private readonly Dictionary<string,LobbyContext> _lobbies = new();
    
    /// <summary>
    /// Creates a new lobby with a unique room code and sets the provided player as the host.
    /// </summary>
    /// <param name="player">The player who is creating and will initially host the room.</param>
    /// <returns>The generated unique code for the newly created room.</returns>
    public string CreateRoom(IPlayer player)
    {
        var roomCode = GenerateRoomCode();
        var lobbyContext = new LobbyContext(player, roomCode);
        _lobbies.Add(roomCode,lobbyContext);
        return roomCode;
    }
    
    /// <summary>
    /// Adds a player to the specified lobby.
    /// </summary>
    /// <param name="roomCode">The code of the room to join.</param>
    /// <param name="player">The player to add to the room.</param>
    /// <exception cref="HubException">Thrown if the room is not found or if the room is already full.</exception>
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
        
        return LeaveRoom(lobbyContext,contextConnectionId);
    }
    
    /// <summary>
    /// Removes a player from the specified lobby.
    /// If the lobby becomes empty after the player leaves, the lobby is removed from the active lobbies.
    /// </summary>
    /// <param name="lobbyContext">The context of the lobby from which the player is leaving.</param>
    /// <param name="contextConnectionId">The connection ID of the player to be removed.</param>
    /// <returns><c>true</c> if the lobby was removed (because it became empty); otherwise, <c>false</c>.</returns>
    public bool LeaveRoom(LobbyContext lobbyContext,string contextConnectionId)
    {
        var player = GetPlayerFromRoom(lobbyContext, contextConnectionId);
        
        RemovePlayer(lobbyContext,player);

        return IsRoomEmpty(lobbyContext) && _lobbies.Remove(lobbyContext.Code);
    }
    
    /// <summary>
    /// Checks if the lobby is empty of human players.
    /// A player is considered human if their ConnectionId does not contain "AI_".
    /// </summary>
    /// <param name="lobbyContext">The context of the lobby to check.</param>
    /// <returns><c>true</c> if there are no human players in the lobby; otherwise, <c>false</c>.</returns>
    public static bool IsRoomEmpty(LobbyContext lobbyContext)
    {
        var humanPlayers = lobbyContext.Players.Count(player => !player.ConnectionId.Contains("AI_"));
        return humanPlayers == 0;
    }
    
    /// <summary>
    /// Adds the specified player to Team 1 in the given lobby.
    /// Ensures the player is removed from Team 2 if they were previously on it.
    /// The player will not be added if Team 1 is already full (2 players) or if the player is already on Team 1.
    /// </summary>
    /// <param name="lobby">The lobby context where the teams are managed.</param>
    /// <param name="player">The player to add to Team 1.</param>
    /// <returns><c>true</c> if the player was successfully added to Team 1; otherwise, <c>false</c>.</returns>
    public static bool AddToTeam1(LobbyContext lobby,IPlayer player)
    {
        if (lobby.Team1.Count == 2 || lobby.Team1.Contains(player))
            return false;
        lobby.Team2.Remove(player);
        lobby.Team1.Add(player);
        return true;
    }

    /// <summary>
    /// Adds the specified player to Team 2 in the given lobby.
    /// Ensures the player is removed from Team 1 if they were previously on it.
    /// The player will not be added if Team 2 is already full (2 players) or if the player is already on Team 2.
    /// </summary>
    /// <param name="lobby">The lobby context where the teams are managed.</param>
    /// <param name="player">The player to add to Team 2.</param>
    /// <returns><c>true</c> if the player was successfully added to Team 2; otherwise, <c>false</c>.</returns>
    public static bool AddToTeam2(LobbyContext lobby,IPlayer player)
    {
        if (lobby.Team2.Count == 2 || lobby.Team2.Contains(player))
            return false;
        lobby.Team1.Remove(player);
        lobby.Team2.Add(player);
        return true;
    }
    
    /// <summary>
    /// Adds a player to the specified lobby if the lobby is not full (max 4 players).
    /// </summary>
    /// <param name="lobby">The lobby context to add the player to.</param>
    /// <param name="player">The player to add.</param>
    /// <returns><c>true</c> if the player was successfully added; otherwise, <c>false</c> (if the lobby was full).</returns>
    public static bool AddPlayer(LobbyContext lobby, IPlayer player)
    {
        if (lobby.Players.Count  == 4)
        {
            return false;
        }
        lobby.Players.Add(player);
        return true;
    }

    /// <summary>
    /// Removes the specified player from the lobby, including from any team they were on.
    /// If the removed player was the host and other players remain, the first player in the list becomes the new host.
    /// </summary>
    /// <param name="lobby">The lobby context from which to remove the player.</param>
    /// <param name="player">The player to remove.</param>
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
    
    /// <summary>
    /// Retrieves a player from the specified lobby based on their connection ID.
    /// </summary>
    /// <param name="lobbyContext">The context of the lobby to search within.</param>
    /// <param name="contextConnectionId">The connection ID of the player to find.</param>
    /// <returns>The <see cref="IPlayer"/> object if found.</returns>
    /// <exception cref="HubException">Thrown if a player with the specified connection ID is not found in the lobby.</exception>
    public static IPlayer GetPlayerFromRoom(LobbyContext lobbyContext, string contextConnectionId)
    {
        var player = lobbyContext.Players.FirstOrDefault(p => p.ConnectionId == contextConnectionId);
        if (player == null)
            throw new HubException("Player not found");
        return player;
    }
    
    /// <summary>
    /// Retrieves a player from a lobby, identified by room code, based on their connection ID.
    /// This is a convenience overload that first retrieves the lobby context using the room code.
    /// </summary>
    /// <param name="roomCode">The code of the room to search within.</param>
    /// <param name="contextConnectionId">The connection ID of the player to find.</param>
    /// <returns>The <see cref="IPlayer"/> object if found.</returns>
    /// <exception cref="HubException">Thrown if the room with the specified code is not found,
    /// or if a player with the specified connection ID is not found in that room.</exception>
    public IPlayer GetPlayerFromRoom(string roomCode, string contextConnectionId)
    {
        var lobbyContext = GetRoom(roomCode);
      
        return GetPlayerFromRoom(lobbyContext, contextConnectionId);
    }
    
    /// <summary>
    /// Retrieves the lobby context for the specified room code.
    /// </summary>
    /// <param name="roomCode">The code of the room to retrieve.</param>
    /// <returns>The <see cref="LobbyContext"/> associated with the given room code.</returns>
    /// <exception cref="HubException">Thrown if a lobby with the specified room code is not found.</exception>
    public LobbyContext GetRoom(string roomCode)
    {
        var room = _lobbies!.GetValueOrDefault(roomCode, null);
        if (room == null)
            throw new HubException("Room not found");
        return room;
    }
    
    /// <summary>
    /// Removes the specified player from both Team 1 and Team 2 in the given lobby.
    /// This effectively makes the player teamless within that lobby.
    /// </summary>
    /// <param name="lobby">The lobby context from which the player will leave teams.</param>
    /// <param name="player">The player to remove from teams.</param>
    public static void LeaveTeam(LobbyContext lobby, IPlayer player)
    {
        lobby.Team1.Remove(player);
        lobby.Team2.Remove(player);
    }
    
    /// <summary>
    /// Removes the specified player from any team they are on within the lobby identified by the room code.
    /// </summary>
    /// <param name="roomCode">The code of the room from which the player will leave teams.</param>
    /// <param name="player">The player to remove from teams.</param>
    /// <exception cref="HubException">Thrown if the room with the specified code is not found.</exception>
    public void LeaveTeam(string roomCode, IPlayer player)
    {
        var lobby = GetRoom(roomCode);
        if (lobby == null)
            throw new HubException("Room not found");
        LeaveTeam(lobby, player);
    }
    /// <summary>
    /// Retrieves a list of all lobbies that contain a player with the specified connection ID.
    /// </summary>
    /// <param name="contextConnectionId">The connection ID of the player to search for in lobbies.</param>
    /// <returns>A list of <see cref="LobbyContext"/> objects representing the lobbies where the player is present. Returns an empty list if the player is not found in any lobby.</returns>
    public List<LobbyContext> GetLobbiesWithUser(string contextConnectionId)
    {
        return _lobbies
            .Where(pair => pair.Value.Players.Any(p => p.ConnectionId == contextConnectionId))
            .Select(lobby => lobby.Value).ToList();
    }
    
    /// <summary>
    /// Removes the lobby associated with the specified room code from the active lobbies.
    /// </summary>
    /// <param name="roomCode">The code of the room to remove.</param>
    public void RemoveRoom(string roomCode)
    {
        _lobbies.Remove(roomCode);
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