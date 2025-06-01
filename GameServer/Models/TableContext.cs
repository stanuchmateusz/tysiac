using GameServer.Services;

namespace GameServer.Models;

public class TableContext
{
    public List<IPlayer> Players { get; }
    public List<IPlayer> Team1 { get; }
    public List<IPlayer> Team2 { get; }
    public string code { get; }

    public TableContext(TableService service, string code)
    {
        Players = service.Players;
        Team1 = service.Team1;
        Team2 = service.Team2;
        this.code = code;
    }

    public TableContext(List<IPlayer> players, List<IPlayer> team1, List<IPlayer> team2, string code)
    {
        Players = players;
        Team1 = team1;
        Team2 = team2;
        this.code = code;
    }
}