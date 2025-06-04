using GameServer.Models.impl;

namespace GameServer.Models;

public interface IPlayer : IPlayerBase
{
    public List<ICard> Hand { get; }
}
