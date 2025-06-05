using System.Text;
using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.impl;
using GameServer.Services;

namespace GameServer;

using Microsoft.AspNetCore.SignalR;

public class GameHub(GameManager gameManager, LobbyService lobbyService, ILogger<GameHub> logger)
    : Hub
{
    private const string GameCreatedMethodName = "GameCreated";
    private const string GameContextUpdateMethodName = "GameContextUpdate";
    private const string GameUserContextUpdateMethodName = "GameUserContextUpdate";
    
    private const string GamePlaceBetMethodName = "PlaceBet";
    private const string GamePassBetMethodName = "PassBet";
    
    private const string GameDealCardsMethodName = "DealCard";
    private const string GamePlayCardMethodName = "PlayCard";
    
    
    private const string MessageReceiveMethodName = "MessageRecieve";
    
    private const string LobbyJoinedMethodName = "RoomJoined";
    private const string LobbyUpdateMethodName = "LobbyUpdate";
    private const string LobbyCreatedMethodName = "RoomCreated";

    public override async Task OnConnectedAsync()
    {
        logger.LogInformation("Connected {ConnId}", Context.ConnectionId );
        //todo try to reconnect? 
        await base.OnConnectedAsync();
    }
    public override Task OnDisconnectedAsync(Exception? exception)
    {
        logger.LogInformation("Disconnected {ConnId}", Context.ConnectionId );
        gameManager.Disconnect(Context.ConnectionId);
        
        return base.OnDisconnectedAsync(exception);
    }
    
    #region Lobby
    
    public async Task GetLobbyContext(string roomCode)
    {
        try
        {
            //validate room and player
            lobbyService.GetPlayerFromRoom(roomCode, Context.ConnectionId);
        }
        catch (HubException exception)
        {
            throw new HubException("Player not found in room");
        }
        await Clients.Caller.SendAsync(LobbyUpdateMethodName, lobbyService.GetRoom(roomCode));
    }
    
    public async Task JoinRoom(string roomCode, string nickname)
    {
        var player = new HumanPlayer(Context.ConnectionId, nickname);
        lobbyService.JoinRoom(roomCode, player);
        
        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync(LobbyJoinedMethodName, roomCode);
        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, 
            lobbyService.GetRoom(roomCode));
        
        logger.LogInformation("Joined {Nickname} room {RoomCode}",nickname, roomCode);
    }

    public async Task JoinTeam(string roomCode, bool isTeam1)
    {
        var lobby = lobbyService.GetRoom(roomCode);
        if (lobby == null)
            throw new HubException("Room not found");
        var player = lobby.GetPlayer(Context.ConnectionId);
        if (player == null)
            throw new HubException("Player not found in room");
        if (isTeam1)
        {
            logger.LogInformation("Joining {Nickname} team1", player.Nickname);
            lobbyService.AddToTeam1(player, lobby);
        }
        else
        {
            logger.LogInformation("Joining {Nickname} team2", player.Nickname);
            lobbyService.AddToTeam2(player, lobby);
        }
        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, lobbyService.GetRoom(roomCode));

    }
    public async Task CreateRoom(string nickname)
    {
        var player = new HumanPlayer(Context.ConnectionId, nickname);
        var roomCode = lobbyService.CreateRoom(player);
        
        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync(LobbyCreatedMethodName, roomCode);
        logger.LogInformation("Created room {RoomCode}", roomCode);

    }

    public async Task LeaveRoom(string roomCode)
    {
        lobbyService.LeaveRoom(roomCode, Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, lobbyService.GetRoom(roomCode));
        logger.LogInformation("Left room {RoomCode}", roomCode);
    }
    #endregion
    
    public async Task StartRoom(string roomCode)
    {
        var room = lobbyService.GetRoom(roomCode);
        if (room == null)
            throw new HubException("Lobby not found");
        
        gameManager.CreateNewGame(room);
        var game = gameManager.GetRoom(roomCode);
        if (game == null)
            throw new HubException("Game not found");
        
        var player = game.GetPlayerFromRoom(Context.ConnectionId);
        
        if (player == null)
            throw new HubException("Player not found in room");
        
        if (game.Players.Count != 4)
            throw new HubException("Teams are not full");

        logger.LogInformation("Starting room {RoomCode}", roomCode);
        
        await Clients.Groups(roomCode).SendAsync(GameCreatedMethodName);
        await StartGame(roomCode);

    }
    
    public async Task ReconnectRoom(string roomCode, string userId)
    {
        throw new NotImplementedException();
    }
    
    public async Task SendMessage(string roomCode, string message )
    {
        var game = gameManager.GetRoom(roomCode);
        IPlayer? player = null;
        if (game == null) //game doesn't exist - send in lobby
        {
            player = lobbyService.GetPlayerFromRoom(roomCode,Context.ConnectionId);
            if (player == null)
                throw new HubException("Room not found");
        }
        else
        {
            player = game.GetPlayerFromRoom(Context.ConnectionId);
            if (player == null)
                throw new HubException("Player not found in room");
        }
        // var player = gameManager.GetRoom(roomCode).GetPlayerFromRoom(Context.ConnectionId) ?? lobbyService.GetPlayerFromRoom(roomCode,Context.ConnectionId);
        await Clients.Groups(roomCode).SendAsync(MessageReceiveMethodName, new {nickname = player.Nickname,message});
    }
    
    public async Task StartGame(string roomCode)
    {
        logger.LogInformation("Starting game in room");
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException("Game not found");
        table.StartGame();
        await Clients.Group(roomCode).SendAsync("GameStarted");//todo sprawdzić czy to jest potrzebne
        await NotifyUpdatedGameState(roomCode);
    }
    public async Task PlaceBid(string roomCode, int bid)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException("Game not found");
        var player = table.Players.First(p => p.ConnectionId == Context.ConnectionId);
        table.PlaceBid(player, bid);
        await NotifyUpdatedGameState(roomCode);
    }
    public async Task GiveCard(string roomCode, string card, string toPlayerId)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException("Game not found");
        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException("Player not found in room");
        var targetPlayer = table.GetPlayerFromRoom(toPlayerId);
        if (targetPlayer == null)
            throw new HubException("Target player not found in room");
        logger.LogInformation("Giving card {Card} to {PlayerId}", card,targetPlayer.Nickname);
        table.DistributeCard(player, card, targetPlayer);
        
        await NotifyUpdatedGameState(roomCode);
    }
    
    public async Task PassBid(string roomCode)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException("Game not found");
        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException("Player not found in room");
        table.PassBid(player);
        await NotifyUpdatedGameState(roomCode);
    }
    
    public async Task PlayCard(string roomCode, string cardShortName)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException("Game not found");
        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException("Player not found in room");
        
        var card = player.Hand.FirstOrDefault(card => card.ShortName == cardShortName);
        if (card == null)
            throw new HubException("Card not found in player's hand");
        table.PlayCard(player,card);
        
        await NotifyUpdatedGameState(roomCode);
    }
    
    private async Task NotifyUpdatedGameState(string roomCode)
    {
        var roomService = gameManager.GetRoom(roomCode);
        if (roomService == null)
            throw new HubException("Room not found");
        await Clients.Group(roomCode).SendAsync(GameContextUpdateMethodName, roomService.GetGameState());
        
        foreach (var player in roomService.Players)
        {
            await Clients.Client(player.ConnectionId).SendAsync(GameUserContextUpdateMethodName, roomService.GetUserState(player));
        }
    }
}
