using GameServer.Models;

namespace GameServer.Services;

public class TableService 
{
    private readonly ILogger<TableService> _logger;

    public List<IPlayer> Players = new(4);
    public List<IPlayer> Team1 = new(2);
    public List<IPlayer> Team2 = new(2);
    
    public string Host { get; set; }
    public TableService(ILogger<TableService> logger, string hostId)
    {
        Host = hostId;
        _logger = logger;
        InitCards();
    }
    
    private void InitCards()
    {
        _logger.LogInformation("Initializing TableService");
    }

    public bool AddToTeam1(IPlayer player)
    {
        if (Team1.Count == 2)
            return false;
        if (Team1.Contains(player))
            return false;
        Team2.Remove(player);
        Team1.Add(player);
        return true;
    }

    public bool AddToTeam2(IPlayer player)
    {
        if (Team2.Count == 2)
            return false;
        if (Team2.Contains(player))
            return false;
        Team1.Remove(player);
        Team2.Add(player);
        return true;
    }

    public bool RemoveFromTeam1(IPlayer player)
    {
        return Team1.Remove(player);
    }
    
    public bool RemoveFromTeam2(IPlayer player)
    {
        return Team2.Remove(player);
    }
    public bool AddPlayer(IPlayer player)
    {
        if (GetPlayersCount() == 4)
        {
            return false;
        }
        Players.Add(player);
        return true;
    }

    public bool RemovePlayer(IPlayer player)
    {
        Team1.Remove(player);
        Team2.Remove(player);
        return Players.Remove(player);
    }
    
    public int GetPlayersCount()
    {
        return Players.Count;
    }
}