using System.Drawing;
using GameServer.Models.Enums;

namespace GameServer.Models;

public interface ICard
{
    CardRank Rank { get;}
    CardSuit Suit { get;}
    ushort Points { get;}
    string ShortName { get;}
}