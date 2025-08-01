﻿
using GameServer.Models.Enums;

namespace GameServer.Models;

public interface IPlayer : IPlayerBase
{
    public List<ICard> Hand { get; set; }
    public Team? Team { get; set; }
}
