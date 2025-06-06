namespace GameServer.Models.Context;

public class LobbyContext
{
    public List<IPlayer> Players { get; }
    public List<IPlayer> Team1 { get; }
    public List<IPlayer> Team2 { get; }
    public string Code { get; }
    public IPlayer Host { get; set; }
    
    public LobbyContext(List<IPlayer> players, List<IPlayer> team1, List<IPlayer> team2, string code)
    {
        Players = players;
        Host = players[0];
        Team1 = team1;
        Team2 = team2;
        Code = code;
    }

    public LobbyContext(IPlayer host, string code)
    {
        Players = [host];
        Host = host;
        Code = code;
        Team1 = [];
        Team2 = [];
    }

    public IPlayer? GetPlayer(string contextConnectionId)
    {
        return Players.FirstOrDefault(x => x.ConnectionId == contextConnectionId);
    }
}