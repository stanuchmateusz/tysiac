using GameServer.Models.Enums;
using GameServer.Services;

namespace GameServer.Models.impl;

public class AIPlayer : IPlayer
{
    public const string AiPrefix = "AI_";
    public string ConnectionId { get; set; }
    public string Nickname { get; set; }
    public string Id { get; set; }
    public bool isBot { get; set; } = true;
    public List<ICard> Hand { get; set; } = new();
    public Team? Team { get; set; }
    
    public AIPlayer(string nickname)
    {
        Id = Guid.NewGuid().ToString();
        Nickname = nickname;
        ConnectionId = AiPrefix + nickname;
    }
    
    public override string ToString() => $"AIPlayer: {Nickname}";
    
}