namespace GameServer.Models.impl;

public class HumanPlayer : IPlayer
{
    public string ConnectionId { get; set; }
    public string Nickname { get; }
    public string Id { get; }
    
    public HumanPlayer(string connectionId, string nickname, string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString();
        ConnectionId = connectionId;
        Nickname = nickname;
    }
}