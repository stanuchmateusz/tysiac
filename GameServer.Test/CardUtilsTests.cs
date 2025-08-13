using GameServer.Models;
using GameServer.Models.impl;
using GameServer.Models.Enums;
using GameServer.Utils;


namespace GameServer.Test;

public class CardUtilsTests
{

    [Theory]
    [InlineData(CardSuit.Hearts, CardRank.Queen)]
    [InlineData(CardSuit.Diamonds, CardRank.King)]
    [InlineData(CardSuit.Clubs, CardRank.Jack)]
    [InlineData(CardSuit.Spades, CardRank.Ten)]
    public void CanPlay_AnyCardWhenNoCardOnTable_ShouldReturnTrue(CardSuit suit, CardRank rank)
    {
        var playerHand = new List<ICard> { new Card(rank, suit) };
        var cardsOnTable = new List<ICard>();
        var cardToPlay = playerHand[0];

        Assert.True(CardUtils.CanPlay(cardToPlay, null, playerHand, cardsOnTable, null));
        Assert.True(CardUtils.CanPlay(cardToPlay, null, playerHand, cardsOnTable, CardSuit.Hearts));
    }

    [Fact]
    public void CanPlay_MustFollowSuitAndCanBeat_ShouldReturnTrue()
    {
        // Leading card Hearts 10 (10 pts), table has Hearts Jack (11 pts)
        var firstOnStack = new Card(CardRank.Ten, CardSuit.Hearts);
        var playerHand = new List<ICard>
        {
            new Card(CardRank.Queen, CardSuit.Hearts), // 12 pts
            new Card(CardRank.Nine, CardSuit.Spades)
        };
        var cardsOnTable = new List<ICard>
        {
            new Card(CardRank.Jack, CardSuit.Hearts) // 11 pts
        };
        var cardToPlay = playerHand[0];

        var result = CardUtils.CanPlay(cardToPlay, firstOnStack, playerHand, cardsOnTable, CardSuit.Spades);

        Assert.True(result);
    }

    [Fact]
    public void CanPlay_MustFollowSuitAndCannotBeat_ShouldReturnTrueIfNoHigherCard()
    {
        var firstOnStack = new Card(CardRank.Ten, CardSuit.Hearts);
        var playerHand = new List<ICard>
        {
            new Card(CardRank.Nine, CardSuit.Hearts), // 0 pts, lower than required
            new Card(CardRank.Nine, CardSuit.Spades)
        };
        var cardsOnTable = new List<ICard>
        {
            new Card(CardRank.King, CardSuit.Hearts) // 14 pts
        };
        var cardToPlay = playerHand[0];

        var result = CardUtils.CanPlay(cardToPlay, firstOnStack, playerHand, cardsOnTable, CardSuit.Spades);

        Assert.True(result);
    }

    [Fact]
    public void CanPlay_NoLeadingSuitButHasTrump_ShouldReturnTrue()
    {
        var firstOnStack = new Card(CardRank.Ten, CardSuit.Clubs);
        var playerHand = new List<ICard>
        {
            new Card(CardRank.Nine, CardSuit.Hearts), // trump
            new Card(CardRank.Nine, CardSuit.Diamonds)
        };
        var cardsOnTable = new List<ICard>
        {
            new Card(CardRank.Jack, CardSuit.Clubs)
        };
        var cardToPlay = playerHand[0];

        var result = CardUtils.CanPlay(cardToPlay, firstOnStack, playerHand, cardsOnTable, CardSuit.Hearts);

        Assert.True(result);
    }

    [Fact]
    public void CanPlay_NoSuitAndNoTrump_ShouldReturnTrue()
    {
        var firstOnStack = new Card(CardRank.Ten, CardSuit.Clubs);
        var playerHand = new List<ICard>
        {
            new Card(CardRank.Nine, CardSuit.Spades),
            new Card(CardRank.Nine, CardSuit.Diamonds)
        };
        var cardsOnTable = new List<ICard>
        {
            new Card(CardRank.Jack, CardSuit.Clubs)
        };
        var cardToPlay = playerHand[0];

        var result = CardUtils.CanPlay(cardToPlay, firstOnStack, playerHand, cardsOnTable, CardSuit.Hearts);

        Assert.True(result);
    }
    
    [Fact]
    public void CanPlay_WhenPlayerHasATrumpWithLowerValueThatWasAllReadyPlayedAndLeadingCardIsDifferentSuit_ShouldReturnTrue()
    {
        // arrange
        var playerHand = new List<ICard>
        {
            new Card(CardRank.Jack, CardSuit.Hearts), //2 pts and a trump
            new Card(CardRank.Ten, CardSuit.Diamonds),
        };
        var cardToPlay = playerHand[1]; // not a trump
        var cardsOnTable = new List<ICard>
        {
            new Card(CardRank.Nine, CardSuit.Clubs),
            new Card(CardRank.Nine, CardSuit.Hearts), //0 pts but trump
            new Card(CardRank.Ten, CardSuit.Hearts) // 10 pts but trump also greater than Jack of Hearts
        };
        var firstOnTable = cardsOnTable[0]; 
        const CardSuit roundSuit = CardSuit.Hearts;
        // act
        var result = CardUtils.CanPlay(cardToPlay,firstOnTable, playerHand, cardsOnTable,roundSuit);
        // assert
        Assert.True(result);
    }


}
