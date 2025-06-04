using System.Text;

namespace GameServer.Models.impl;

public class Card : ICard
{
    public CardName Name { get; }
    public CardColor Color { get; }
    public ushort Points { get; }
    public string ShortName { get; }

    public Card(CardName name, CardColor color)
    {
        Name = name;
        Color = color;
        Points = CalculatePoints();
        ShortName = GetShortName();
    }

    private string GetShortName()
    {
        return new StringBuilder()
            .Append(Name switch
            {
                CardName.As => "A",
                CardName.King => "K",
                CardName.Queen => "Q",
                CardName.Jack => "J",
                CardName.Ten => "10",
                CardName.Nine => "9",
                _ => throw new ArgumentOutOfRangeException("Invalid card name")
            })
            .Append(Color switch
            {
                CardColor.Spades => "S",
                CardColor.Clubs => "C",
                CardColor.Hearts => "H",
                CardColor.Diamonds => "D",
                _ => throw new ArgumentOutOfRangeException("Invalid color")
            })
            .ToString();
    }
    private ushort CalculatePoints()
    {
        return Name switch
        {
            CardName.As => 11,
            CardName.King => 4,
            CardName.Queen => 3,
            CardName.Jack => 2,
            CardName.Ten => 10,
            _ => 0
        };
    }

    public override string ToString()
    {
        return Name + " of " + Color;
    }
}