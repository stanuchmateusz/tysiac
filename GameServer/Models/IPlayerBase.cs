namespace GameServer.Models;

public interface IPlayerBase
{
    string ConnectionId { get; set; }
    string Id { get; }
    public string Nickname { get; }
}