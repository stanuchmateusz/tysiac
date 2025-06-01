using System.Collections.ObjectModel;
using System.Text;
using GameServer.Models;
using GameServer.Models.impl;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Services;

public class GameManager : IGameManager
{
    private Dictionary<string,TableService> _tables;
    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger<GameManager> _logger;

    public GameManager(ILoggerFactory loggerFactory)
    {
        _loggerFactory = loggerFactory;
        _logger = loggerFactory.CreateLogger<GameManager>();
        _tables = new Dictionary<string,TableService>();
    }

    public void JoinRoom(string roomCode, IPlayer player)
    {
        var tabServ =  _tables!.GetValueOrDefault(roomCode, null);
        if (tabServ == null)
            throw new HubException("Room not found");
        if (!tabServ.AddPlayer(player))
            throw new HubException("Room is full");
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

    public TableService? GetRoom(string roomCode)
    {
        return _tables!.GetValueOrDefault(roomCode, null);
    }
    
    public string CreateRoom(IPlayer player)
    {
        var roomCode = GenerateRoomCode();
        var logger = _loggerFactory.CreateLogger<TableService>();
        var tableService = new TableService(logger,player.ConnectionId);
        tableService.AddPlayer(player);
        _tables.Add(roomCode,tableService);
        return roomCode;
    }

    public IList<IPlayer> GetPlayers(string roomCode)
    {
        var tabServ =  _tables!.GetValueOrDefault(roomCode, null);
        if (tabServ == null)
            throw new HubException("Room not found");
        return tabServ.Players;
    }

    public bool LeaveRoom(string roomCode,string contextConnectionId)
    {
        var tabServ =  _tables!.GetValueOrDefault(roomCode, null);
        if (tabServ == null)
            throw new HubException("Room not found");
        var player = tabServ.Players.FirstOrDefault(p => p.ConnectionId == contextConnectionId);
        if (player == null)
            throw new HubException("Player not found");
        tabServ.RemovePlayer(player);
        if (tabServ.GetPlayersCount() == 0)
            _tables.Remove(roomCode);
        return true;
    }

    public void Disconnect(string contextConnectionId)
    {
        //find rooms with user 
        var tabServ = _tables!.Values.Where(t => t.Players.Any(p => p.ConnectionId == contextConnectionId));
        var tables = tabServ as TableService[] ?? tabServ.ToArray();
        if (tables.Length == 0)
            return;
        foreach (var table in tables)
        {
            LeaveRoom(_tables.Keys.Where(x => _tables[x] == table).ToString(), contextConnectionId);
        }
    }
}