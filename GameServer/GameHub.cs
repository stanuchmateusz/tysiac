using System.Text;
using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.Enums;
using GameServer.Models.impl;
using GameServer.Services;
using Serilog;

namespace GameServer;

using Microsoft.AspNetCore.SignalR;

public class GameHub(GameManager gameManager, LobbyManager lobbyManager)
    : Hub
{
    private const string LeaveGameMethodName = "LeaveGame";
    private const string GameCreatedMethodName = "GameCreated";
    private const string UpdateMethodName = "UpdateContext";

    private const string MessageReceiveMethodName = "MessageRecieve";

    private const string KickedMethodName = "Kicked";
    private const string LobbyJoinedMethodName = "RoomJoined";
    private const string LobbyUpdateMethodName = "LobbyUpdate";
    private const string LobbyCreatedMethodName = "RoomCreated";
    
    private const string PlayerNotFoundExceptionMessage = "Player not found in room ";
    private const string GameNotFoundExceptionMessage = "Game not found";

    private const int BotTurnDelay = 1200;
    private const int AfterTakeDelay = 2000;

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        if (httpContext == null)
        {
            Log.Error("HttpContext is null on connection");
            throw new HubException("HttpContext is null");
        }

        var connectionId = Context.ConnectionId;
        var userIdFromQuery = httpContext.Request.Query["userId"];
        var userId = userIdFromQuery.Count > 0 ? userIdFromQuery[0] : null;

        Log.Debug("Connected {ConnId}", connectionId);

        if (!string.IsNullOrEmpty(userId))
        {
            Log.Debug("{ConnID} - trying to restore connection - userId:{UserId} ", connectionId, userId);
            var code = gameManager.TryToRestoreConnection(connectionId, userId);
            if (code != null)
            {
                await Groups.AddToGroupAsync(connectionId, code);
                await Clients.Client(connectionId).SendAsync("ReconnectState", code);
                var gameService = gameManager.GetRoom(code);
                if (gameService != null)
                {
                    await NotifyUpdatedGameState(gameService);
                }
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Log.Debug("Disconnected {ConnId}", Context.ConnectionId);

        var lobbiesWithUser = lobbyManager.GetLobbiesWithUser(Context.ConnectionId);
        foreach (var lobbyCtx in lobbiesWithUser)
        {
            if (lobbyManager.LeaveRoom(lobbyCtx, Context.ConnectionId))
            {
                Log.Information("Left room {RoomCode} and lobby got disposed", lobbyCtx.Code);
            }
            else
            {
                Log.Information("Left room {RoomCode}", lobbyCtx.Code);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, lobbyCtx.Code);
                await Clients.Groups(lobbyCtx.Code).SendAsync(LobbyUpdateMethodName,
                    lobbyManager.GetRoom(lobbyCtx.Code));
            }
        }

        var games = gameManager.Disconnect(Context.ConnectionId);
        foreach (var game in games)
        {
            await NotifyUpdatedGameState(game);
        }

        await base.OnDisconnectedAsync(exception);
    }

    #region Lobby

    public async Task GetLobbyContext(string roomCode)
    {
        // Check if the room exists and the player is in it
        lobbyManager.GetPlayerFromRoom(roomCode, Context.ConnectionId);
        var room = lobbyManager.GetRoom(roomCode);

        await Clients.Caller.SendAsync(LobbyUpdateMethodName, room);
    }

    public async Task JoinRoom(string roomCode, string nickname)
    {
        var player = new HumanPlayer(Context.ConnectionId, nickname);
        lobbyManager.JoinRoom(roomCode, player);

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync(LobbyJoinedMethodName, roomCode);
        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName,
            lobbyManager.GetRoom(roomCode));

        Log.Information("Joined {Nickname} room {RoomCode}", nickname, roomCode);
    }

    public async Task JoinTeam(string roomCode, bool isTeam1)
    {
        var lobby = lobbyManager.GetRoom(roomCode);

        var player = lobby.GetPlayer(Context.ConnectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);
        if (isTeam1)
        {
            Log.Information("Joining {Nickname} team1", player.Nickname);
            LobbyManager.AddToTeam1(lobby, player);
        }
        else
        {
            Log.Information("Joining {Nickname} team2", player.Nickname);
            LobbyManager.AddToTeam2(lobby, player);
        }

        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, lobbyManager.GetRoom(roomCode));
    }

    public async Task CreateRoom(string nickname)
    {
        var player = new HumanPlayer(Context.ConnectionId, nickname);
        var roomCode = lobbyManager.CreateRoom(player);

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync(LobbyCreatedMethodName, roomCode);
        Log.Information("Created room {RoomCode}", roomCode);
    }

    public async Task LeaveTeam(string roomCode)
    {
        var player = lobbyManager.GetPlayerFromRoom(roomCode, Context.ConnectionId);

        lobbyManager.LeaveTeam(roomCode, player);
        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, lobbyManager.GetRoom(roomCode));
        Log.Information("Left {Player} left team in {RoomCode}", player, roomCode);
    }

    public async Task AddBots(string roomCode)
    {
        var table = lobbyManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException(GameNotFoundExceptionMessage);
        var isHost = table.Host.ConnectionId == Context.ConnectionId;
        if (!isHost)
            throw new HubException("Only host can add bots!");
        var addedBotsCount = table.AddBots();
        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, lobbyManager.GetRoom(roomCode));
        Log.Information("Added {Bots} to {RoomCode}", addedBotsCount, roomCode);
    }

    public async Task KickPlayer(string roomCode, string connectionId)
    {
        var table = lobbyManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException(GameNotFoundExceptionMessage);
        var isHost = table.Host.ConnectionId == Context.ConnectionId;
        if (!isHost)
            throw new HubException("Only host can kick players");
        var player = table.GetPlayer(connectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);
        //kick player 
        lobbyManager.LeaveRoom(roomCode, player.ConnectionId);
        await Clients.Client(player.ConnectionId).SendAsync(KickedMethodName);
        await Groups.RemoveFromGroupAsync(connectionId, roomCode);

        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, lobbyManager.GetRoom(roomCode));
        Log.Information("Kicked {Player} from {RoomCode}", player, roomCode);
    }

    public async Task LeaveRoom(string roomCode)
    {
        try
        {
            if (lobbyManager.LeaveRoom(roomCode, Context.ConnectionId))
            {
                Log.Information("Left room {RoomCode} and lobby got disposed", roomCode);
                return;
            }
        }
        catch (HubException _)
        {
            //ignore
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Groups(roomCode).SendAsync(LobbyUpdateMethodName, lobbyManager.GetRoom(roomCode));
        Log.Information("Left room {RoomCode}", roomCode);
    }

    public async Task StartRoom(string roomCode)
    {
        var lobbyCtx = lobbyManager.GetRoom(roomCode);

        if (lobbyCtx.Host.ConnectionId != Context.ConnectionId)
            throw new HubException("Only host can start the game");

        if (lobbyCtx.Players.Count < 4)
            throw new HubException("Not enough players to start the game");

        gameManager.CreateNewGame(lobbyCtx);
        var gameService = gameManager.GetRoom(roomCode);
        if (gameService == null)
            throw new HubException(GameNotFoundExceptionMessage);

        Log.Information("Starting room {RoomCode}", roomCode);

        //cleanup lobby
        lobbyManager.RemoveRoom(roomCode);

        await StartGame(roomCode);
        await Clients.Groups(roomCode).SendAsync(GameCreatedMethodName);
    }

    #endregion

    public async Task SendMessage(string roomCode, string message)
    {
        var game = gameManager.GetRoom(roomCode);
        IPlayer? player = null;
        if (game == null) //game doesn't exist - send in lobby
        {
            player = lobbyManager.GetPlayerFromRoom(roomCode, Context.ConnectionId);
        }
        else
        {
            player = game.GetPlayerFromRoom(Context.ConnectionId);
            if (player == null)
                throw new HubException(PlayerNotFoundExceptionMessage + roomCode);
        }

        await Clients.Groups(roomCode).SendAsync(MessageReceiveMethodName, new { nickname = player.Nickname, message });
    }

    #region Game Actions

    public async Task GetGameContext(string roomCode)
    {
        var gameService = gameManager.GetRoom(roomCode);
        if (gameService == null)
            throw new HubException(GameNotFoundExceptionMessage);
        var player = gameService.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);
        var gameContext = gameService.GetGameState();

        await Clients.Client(player.ConnectionId).SendAsync(UpdateMethodName, new UpdateContext
        {
            GameCtx = gameContext,
            UserCtx = gameService.GetUserState(player)
        });
    }

    /// <summary>
    /// Starts the game in the specified room.
    /// Sends a notification to all clients in the room.
    /// <param name="roomCode">code of the room</param>
    /// If the room does not exist, throws a HubException.
    /// </summary>
    public async Task StartGame(string roomCode)
    {
        Log.Information("Starting game in room");
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException(GameNotFoundExceptionMessage);
        table.StartGame();
        await Clients.Group(roomCode).SendAsync("GameStarted");
        await NotifyUpdatedGameState(roomCode);
    }

    public async Task LeaveGame(string roomCode)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
        {
            return;
        }

        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);

        Log.Information("Permanently leaving game {RoomCode} for player {Player}", roomCode, player.Nickname);

        table.PauseGame(player);
        table.AbandoneGame(player);

        if (table.AllPlayersLeft())
        {
            gameManager.RemoveRoom(roomCode);
            Log.Information("Game {RoomCode} has been removed", roomCode);
            return;
        }

        await Clients.Group(roomCode).SendAsync(LeaveGameMethodName, player.Nickname);
        try
        {
            await NotifyUpdatedGameState(roomCode);
        }
        catch (Exception e)
        {
            Log.Warning("[{Code}] {Message}" ,roomCode,e.Message);
        }
    }

    public async Task PlaceBid(string roomCode, int bid)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException(GameNotFoundExceptionMessage);
        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);
        table.PlaceBid(player, bid);
        await NotifyUpdatedGameState(roomCode);
    }

    public async Task GiveCard(string roomCode, string card, string toPlayerId)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException(GameNotFoundExceptionMessage);
        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);
        var targetPlayer = table.GetPlayerFromRoom(toPlayerId);
        if (targetPlayer == null)
            throw new HubException("Target player not found in room");
        Log.Debug("[{RoomCode}] Giving card {Card} to {PlayerId}", roomCode, card, targetPlayer.Nickname);
        table.DistributeCard(player, card, targetPlayer);

        await NotifyUpdatedGameState(roomCode);
    }

    public async Task PassBid(string roomCode)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException(GameNotFoundExceptionMessage);
        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);
        table.PassBid(player);
        await NotifyUpdatedGameState(roomCode);
    }

    public async Task PlayCard(string roomCode, string cardShortName)
    {
        var table = gameManager.GetRoom(roomCode);
        if (table == null)
            throw new HubException(GameNotFoundExceptionMessage);

        var player = table.GetPlayerFromRoom(Context.ConnectionId);
        if (player == null)
            throw new HubException(PlayerNotFoundExceptionMessage + roomCode);

        var card = player.Hand.FirstOrDefault(card => card.ShortName == cardShortName);
        if (card == null)
            throw new HubException("Card not found in player's hand");
        table.PlayCard(player, card);

        await NotifyUpdatedGameState(table);
        if (table.CurrentPhase == GamePhase.ShowTable)
        {
            Log.Debug("GamePhase.ShowTable");
            var updateCtx = Task.Run(async () =>
            {
                Log.Debug("Waiting to update");
                await Task.Delay(AfterTakeDelay);
                table.CurrentPhase = GamePhase.Playing;
                table.CompleteTake();

                Log.Debug("Finished update");
                await NotifyUpdatedGameState(table);
            });
            await updateCtx;
        }
    }

    private async Task NotifyUpdatedGameState(string roomCode)
    {
        var roomService = gameManager.GetRoom(roomCode);
        if (roomService == null)
            throw new HubException(GameNotFoundExceptionMessage);
        await NotifyUpdatedGameState(roomService);
    }

    private async Task NotifyUpdatedGameState(GameService gameService)
    {
        var gameContext = gameService.GetGameState();
        foreach (var player in gameService.Players.Where(p => !p.isBot))
        {
            await Clients.Client(player.ConnectionId).SendAsync(UpdateMethodName, new UpdateContext
            {
                GameCtx = gameContext,
                UserCtx = gameService.GetUserState(player)
            });
        }

        while (gameService.CurrentPhase is GamePhase.IncreaseBet or GamePhase.Playing or GamePhase.CardDistribution or GamePhase.Auction)
        {
            var currentPlayer = gameService.GetGameState().CurrentPlayer;

            if (currentPlayer is AIPlayer bot)
            {
                Log.Debug("[{RoomCode}] Processing turn for bot: {BotNickname} in phase {GamePhase}",
                    gameService.RoomCode, bot.Nickname, gameService.CurrentPhase);
                
                AiService.ProcessTurn(gameService,
                    bot);
                
                await Task.Delay(BotTurnDelay);
                
                var gameContextAfterBotMove = gameService.GetGameState();
                
                foreach (var player in
                         gameService.Players.Where(p => !p.isBot && !string.IsNullOrEmpty(p.ConnectionId)))
                {
                    await Clients.Client(player.ConnectionId).SendAsync(UpdateMethodName, new UpdateContext
                    {
                        GameCtx = gameContextAfterBotMove,
                        UserCtx = gameService.GetUserState(player)
                    });
                }
                
                if (gameService.CurrentPhase == GamePhase.GameOver)
                {
                    Log.Debug("[{RoomCode}] Game ended after bot's turn.", gameService.RoomCode);
                    break;
                }
            }
            else
            {
                Log.Debug(
                    "[{RoomCode}] Current player {PlayerNickname} is human or null, stopping bot processing loop.",
                    gameService.RoomCode, currentPlayer?.Nickname);
                break;
            }
        }
    }

    #endregion
}

public class UpdateContext
{
    public required GameContext GameCtx { get; set; }
    public required UserContext UserCtx { get; set; }
}