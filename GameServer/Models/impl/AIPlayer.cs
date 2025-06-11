using GameServer.Models.Enums;

namespace GameServer.Models.impl;

public class AIPlayer : IPlayer
{
    public string ConnectionId { get; set; } = "AI";
    public string Nickname { get; set; }
    public string Id { get; set; }
    public List<ICard> Hand { get; set; } = new();
    public Team? Team { get; set; }

    public AIPlayer(string nickname)
    {
        Id = Guid.NewGuid().ToString();
        Nickname = nickname;
    }

    public override string ToString() => $"AIPlayer: {Nickname}";
}