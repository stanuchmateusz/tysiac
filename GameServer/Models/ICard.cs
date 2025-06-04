using System.Drawing;

namespace GameServer.Models;

public interface ICard
{
    CardRank Rank { get;}
    CardSuit Suit { get;}
    ushort Points { get;}
    string ShortName { get;}
}