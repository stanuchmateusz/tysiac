using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.impl;

public class LobbyService
{
    private LobbyContext context;
    private List<IPlayer> bannedPlayers = [];
    public LobbyService(string code, IPlayer host)
    {
        context = new LobbyContext(code, [host], [], [], new GameSettings());
    }

    public LobbyContext GetContext()
    {
        return context;
    }

    public IPlayer? GetPlayer(string contextConnectionId)
    {
        return context.Players.FirstOrDefault(x => x.ConnectionId == contextConnectionId);
    }

    public bool AddPlayer(IPlayer player)
    {
        if (bannedPlayers.Contains(player) || (context.Players.Count > 3))
            return false;
        context.Players.Add(player);
        return true;
    }

    public void RemovePlayer(IPlayer player)
    {
        context.Team1.Remove(player);
        context.Team2.Remove(player);

        context.Players.Remove(player);
        if (context.Host.Id == player.Id && context.Players.Count > 0)
        {
            context.Host = context.Players[0]; // Promote the first player as the new host
        }

    }
    public void KickPlayer(IPlayer player)
    {
        if (bannedPlayers.Contains(player))
            throw new InvalidOperationException("Player is already banned");

        bannedPlayers.Add(player);
        RemovePlayer(player);
    }

    public int AddBots()
    {
        if (context.Team1.Count == 2 && context.Team2.Count == 2)
            return 0; // No bots needed, both teams are full

        var addedBots = context.Players.Count(player => player.ConnectionId.Contains(AIPlayer.AiPrefix));
        while (context.Team1.Count != 2 && addedBots != 3)
        {
            var bot = new AIPlayer("BOT" + addedBots);
            context.Players.Add(bot);
            context.Team1.Add(bot);
            addedBots++;
        }
        while (context.Team2.Count != 2 && addedBots != 3)
        {
            var bot = new AIPlayer("BOT" + addedBots);
            context.Players.Add(bot);
            context.Team2.Add(bot);
            addedBots++;
        }
        return addedBots;
    }
    public bool IsRoomEmpty()
    {
        var humanPlayers = context.Players.Count(player => !player.ConnectionId.Contains(AIPlayer.AiPrefix));
        return humanPlayers == 0;
    }

    public bool isPlayerBanned(string connectionId)
    {
        return bannedPlayers.Any(x => x.ConnectionId == connectionId);
    }

    public bool isHost(string connectionId)
    {
        if (context.Host == null)
            return false;

        return context.Host.ConnectionId == connectionId;
    }

    public bool IsLobbyReady()
    {
        return context.Players.Count >= 4 && context.Team1.Count == 2 && context.Team2.Count == 2;
    }

    public void LeaveTeam(IPlayer player)
    {
        context.Team1.Remove(player);
        context.Team2.Remove(player);
    }

    public bool JoinTeam1(IPlayer player)
    {
        if (context.Team1.Count < 2 && !context.Team1.Contains(player))
        {
            context.Team2.Remove(player);
            context.Team1.Add(player);
            return true;
        }
        return false; 
    }

    public bool JoinTeam2(IPlayer player)
    {
        if (context.Team2.Count < 2 && !context.Team2.Contains(player))
        {
            context.Team1.Remove(player);
            context.Team2.Add(player);
            return true;
        }
        return false; 
    }
}
