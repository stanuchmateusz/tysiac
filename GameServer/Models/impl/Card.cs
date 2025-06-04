using System.Text;

namespace GameServer.Models.impl;

public class Card : ICard
{
    public CardRank Rank { get; }
    public CardSuit Suit { get; }
    public ushort Points { get; }
    public string ShortName { get; }

    public Card(CardRank rank, CardSuit suit)
    {
        Rank = rank;
        Suit = suit;
        Points = CalculatePoints();
        ShortName = GetShortName();
    }

    private string GetShortName()
    {
        return new StringBuilder()
            .Append(Rank switch
            {
                CardRank.As => "A",
                CardRank.King => "K",
                CardRank.Queen => "Q",
                CardRank.Jack => "J",
                CardRank.Ten => "10",
                CardRank.Nine => "9",
                _ => throw new ArgumentOutOfRangeException("Invalid card name")
            })
            .Append(Suit switch
            {
                CardSuit.Spades => "S",
                CardSuit.Clubs => "C",
                CardSuit.Hearts => "H",
                CardSuit.Diamonds => "D",
                _ => throw new ArgumentOutOfRangeException("Invalid color")
            })
            .ToString();
    }
    private ushort CalculatePoints()
    {
        return Rank switch
        {
            CardRank.As => 11,
            CardRank.King => 4,
            CardRank.Queen => 3,
            CardRank.Jack => 2,
            CardRank.Ten => 10,
            _ => 0
        };
    }

    public override string ToString()
    {
        return Rank + " of " + Suit;
    }
}