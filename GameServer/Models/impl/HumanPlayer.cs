using GameServer.Models.Enums;

namespace GameServer.Models.impl;

public class HumanPlayer : IPlayer
{
    public string ConnectionId { get; set; }
    public string Nickname { get;set; }
    public string Id { get; set; }
    public List<ICard> Hand { get; set; } = new();
    public Team? Team { get; set; }
    public bool isBot { get; set; } = false;

    public HumanPlayer(string connectionId, string nickname, string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString();
        ConnectionId = connectionId;
        Nickname = nickname;
    }
    
    public override string ToString()
    {
        return $"HumanPlayer: {Nickname}";
    }
}