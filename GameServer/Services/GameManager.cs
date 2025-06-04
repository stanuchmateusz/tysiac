using System.Collections.ObjectModel;
using System.Text;
using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.impl;
using Microsoft.AspNetCore.SignalR;

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

    public void LeaveRoom(string roomCode, string contextConnectionId)
    {
        //todo no tu pewnie jakieś pauzowanie jak ktoś wyjdzie czy coś? 
    }

    public void Disconnect(string contextConnectionId)
    {
        //find rooms with user 
        var tabServ = _tables!.Values.Where(t => t.Players.Any(p => p.ConnectionId == contextConnectionId));
        var tables = tabServ as GameService[] ?? tabServ.ToArray();
        if (tables.Length == 0)
            return;
        foreach (var table in tables)
        {
            LeaveRoom(_tables.Keys.Where(x => _tables[x] == table).ToString(), contextConnectionId);
        }
    }
    
}