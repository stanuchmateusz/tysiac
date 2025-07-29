namespace GameServer.Models;

public interface IPlayerBase
{
    string ConnectionId { get; set; }
    string Id { get; set; }
    public string Nickname { get; set; }
    public bool IsBot { get; set; }
}