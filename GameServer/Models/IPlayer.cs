namespace GameServer.Models;

public interface IPlayer
{
    string ConnectionId { get; set; }
    string Id { get; }
    public string Nickname { get; }
}