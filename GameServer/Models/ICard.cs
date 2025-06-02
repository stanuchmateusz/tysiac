using System.Drawing;

namespace GameServer.Models;

public interface ICard
{
    CardName Name { get;}
    CardColor Color { get;}
    ushort Points { get;}
    string ShortName { get;}
}