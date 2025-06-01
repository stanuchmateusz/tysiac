using System.Text;
using GameServer.Models;
using GameServer.Models.impl;
using GameServer.Services;

namespace GameServer;

using Microsoft.AspNetCore.SignalR;

public class GameHub : Hub
{
    private const string RoomjoinedMethodName = "RoomJoined";
    private const string RoomUpdateMethodName = "RoomUpdate";
    private const string RoomReconnectMethodName = "RoomReconnect";
    private const string RoomCreatedMethodName = "RoomCreated";
    private const string MessageReceiveMethodName = "MessageRecieve";
    
    private readonly ILogger<GameHub> _logger;
    private readonly IGameManager _gameManager;
    
    public GameHub(IGameManager gameManager, ILogger<GameHub> logger)
    {
        _logger = logger;
        _gameManager = gameManager;
    }
    
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Connected {ConnId}", Context.ConnectionId );
        await base.OnConnectedAsync();
    }

    public async Task ReconnectRoom(string roomCode, string userId)
    {
        var player = _gameManager.GetPlayers(roomCode).First(p => p.Id == userId);
        if (player == null)
            return;
        player.ConnectionId = Context.ConnectionId;
        
    }
    
    public async Task SendMessage(string roomCode, string message )
    {
       var player = _gameManager.GetPlayers(roomCode).First(p => p.ConnectionId == Context.ConnectionId);
       if (player == null)
           throw new HubException("Player not found in room");
       await Clients.Groups(roomCode).SendAsync(MessageReceiveMethodName, new {nickname = player.Nickname,message});
    }
    public async Task GetRoomContext(string roomCode)
    {
        var player = _gameManager.GetPlayers(roomCode).First(p => p.ConnectionId == Context.ConnectionId);
        if (player == null)
            throw new HubException("Player not found in room");
        await Clients.Caller.SendAsync(RoomUpdateMethodName, new TableContext(_gameManager.GetRoom(roomCode),roomCode));
    }
    
    public async Task JoinRoom(string roomCode, string nickname)
    {
        var player = new HumanPlayer(Context.ConnectionId, nickname);
        _gameManager.JoinRoom(roomCode, player);
        
        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync(RoomjoinedMethodName, roomCode);
        await Clients.Groups(roomCode).SendAsync(RoomUpdateMethodName, 
            new TableContext(_gameManager.GetRoom(roomCode),roomCode));
        
        _logger.LogInformation("Joined {Nickname} room {RoomCode}",nickname, roomCode);
    }

    public async Task JoinTeam(string roomCode, bool isTeam1)
    {
        var player = _gameManager.GetPlayers(roomCode).First(p => p.ConnectionId == Context.ConnectionId);
        if (player == null)
            throw new HubException("Player not found in room");
        if (isTeam1)
        {
            _logger.LogInformation("Joining {Nickname} team1", player.Nickname);
            _gameManager.GetRoom(roomCode).AddToTeam1(player);
        }
        else
        {
            _logger.LogInformation("Joining {Nickname} team2", player.Nickname);
            _gameManager.GetRoom(roomCode).AddToTeam2(player);
        }
        await Clients.Groups(roomCode).SendAsync(RoomUpdateMethodName, new TableContext(_gameManager.GetRoom(roomCode),roomCode));

    }
    public async Task CreateRoom(string nickname)
    {
        var player = new HumanPlayer(Context.ConnectionId, nickname);
        var roomCode = _gameManager.CreateRoom(player);
        
        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync(RoomCreatedMethodName, roomCode);
        _logger.LogInformation("Created room {RoomCode}", roomCode);

    }

    public async Task LeaveRoom(string roomCode)
    {
        _gameManager.LeaveRoom(roomCode, Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Groups(roomCode).SendAsync(RoomUpdateMethodName, new TableContext(_gameManager.GetRoom(roomCode),roomCode));
        _logger.LogInformation("Left room {RoomCode}", roomCode);
    }
    public override Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Disconnected {ConnId}", Context.ConnectionId );
        _gameManager.Disconnect(Context.ConnectionId);
        
        return base.OnDisconnectedAsync(exception);
    }
}
