using GameServer.Models.impl;

namespace GameServer.Models.Context;

public class LobbyContext
{
    public List<IPlayer> Players { get; }
    public List<IPlayer> Team1 { get; }
    public List<IPlayer> Team2 { get; }
    public string Code { get; }
    public IPlayer Host { get; set; }
    public IGameSettings GameSettings { get; set; } = new GameSettings();

    public LobbyContext(string code, List<IPlayer> players, List<IPlayer> team1, List<IPlayer> team2, IGameSettings gameSettings)
    {
        Code = code;
        Players = players;
        Host = players[0];
        Team1 = team1;
        Team2 = team2;
        GameSettings = gameSettings;
    }

    public LobbyContext(string code, IPlayer host)
    {
        Code = code;
        Players = [host];
        Host = host;
        Team1 = [];
        Team2 = [];
        GameSettings = new GameSettings();
    }
}