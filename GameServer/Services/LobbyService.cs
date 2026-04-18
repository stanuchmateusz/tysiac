using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.impl;
using GameServer.Utils;

namespace GameServer.Services;

/// <summary>
/// LobbyService manages the lobby context, including player management, team assignments, and game settings.
/// It provides methods to add, remove, and manage players, as well as to check lobby readiness.
/// </summary>
/// <remarks>
/// This service is responsible for maintaining the state of the lobby, including player lists, team compositions,
/// and game settings. It also handles player bans and team assignments.
/// </remarks>
/// <exception cref="InvalidOperationException">Thrown when attempting to kick a player who is already banned.</exception>
/// <exception cref="ArgumentException">Thrown when an invalid suit is provided for trump points.</exception>
/// <exception cref="ArgumentNullException">Thrown when a null collection is provided where a non-null collection is expected.</exception>
/// <seealso cref="LobbyContext"/>
public class LobbyService(string code, IPlayer host)
{
    private LobbyContext Context { get; } = new LobbyContext(code, [host], [], [], new GameSettings());
    private readonly HashSet<String> BannedPlayers = [];

    public LobbyContext GetContext()
    {
        return Context;
    }

    public void UpdateGameSettings(IGameSettings settings)
    {
        Context.GameSettings.UnlimitedWin = settings.UnlimitedWin;
        Context.GameSettings.AllowRaise = settings.AllowRaise;
    }

    public IPlayer? GetPlayer(string ContextConnectionId)
    {
        return Context.Players.FirstOrDefault(x => x.ConnectionId == ContextConnectionId);
    }

    public bool AddPlayer(IPlayer player)
    {
        if (BannedPlayers.Contains(player.Id) || (Context.Players.Count > 3))
            return false;
        Context.Players.Add(player);
        return true;
    }

    public void RemovePlayer(IPlayer player)
    {
        Context.Team1.Remove(player);
        Context.Team2.Remove(player);

        Context.Players.Remove(player);
        if (Context.Host.Id == player.Id && Context.Players.Count > 0)
        {
            Context.Host = Context.Players[0]; // Promote the first player as the new host
        }

    }
    public void KickPlayer(IPlayer player)
    {
        if (BannedPlayers.Contains(player.Id))
            throw new InvalidOperationException("Player is already banned");

        BannedPlayers.Add(player.Id);
        RemovePlayer(player);
    }

    public int AddBots()
    {
        if (Context.Players.Count == 4)
            return 0; // No bots needed, max players reached
        if (Context.Team1.Count == 2 && Context.Team2.Count == 2)
            return 0; // No bots needed, both teams are full

        var addedBots = Context.Players.Count(player => player.ConnectionId.Contains(AIPlayer.AiPrefix));
        while (Context.Players.Count != 4 && Context.Team1.Count != 2 && addedBots != 3)
        {
            var bot = new AIPlayer("BOT " + RandomUtils.GenerateRandomName());
            Context.Players.Add(bot);
            Context.Team1.Add(bot);
            addedBots++;
        }
        while (Context.Players.Count != 4 && Context.Team2.Count != 2 && addedBots != 3)
        {
            var bot = new AIPlayer("BOT " + RandomUtils.GenerateRandomName());
            Context.Players.Add(bot);
            Context.Team2.Add(bot);
            addedBots++;
        }
        return addedBots;
    }
    public bool IsRoomEmpty()
    {
        var humanPlayers = Context.Players.Count(player => !player.ConnectionId.Contains(AIPlayer.AiPrefix));
        return humanPlayers == 0;
    }

    public bool isPlayerBanned(string connectionId)
    {
        return BannedPlayers.Contains(connectionId);
    }

    public bool isHost(string connectionId)
    {
        if (Context.Host == null)
            return false;

        return Context.Host.ConnectionId == connectionId;
    }

    public bool IsLobbyReady()
    {
        return Context.Players.Count >= 4 && Context.Team1.Count == 2 && Context.Team2.Count == 2;
    }

    public void LeaveTeam(IPlayer player)
    {
        Context.Team1.Remove(player);
        Context.Team2.Remove(player);
    }

    public bool JoinTeam1(IPlayer player)
    {
        if (Context.Team1.Count < 2 && !Context.Team1.Contains(player))
        {
            Context.Team2.Remove(player);
            Context.Team1.Add(player);
            return true;
        }
        return false;
    }

    public bool JoinTeam2(IPlayer player)
    {
        if (Context.Team2.Count < 2 && !Context.Team2.Contains(player))
        {
            Context.Team1.Remove(player);
            Context.Team2.Add(player);
            return true;
        }
        return false;
    }
}
