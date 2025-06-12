using GameServer.Models;
using GameServer.Models.Enums;
using Serilog;

namespace GameServer.Utils;

public static class CardUtils
{
    public static int GetTrumpPoints(CardSuit cardSuit)
    {
        return cardSuit switch
        {
            CardSuit.Hearts => 100,
            CardSuit.Diamonds => 80,
            CardSuit.Clubs => 60,
            CardSuit.Spades => 40,
            _ => throw new ArgumentException("Invalid suit for trump points")
        };
    }
    
    public static bool CanPlay(ICard cardToPlay, ICard firstOnStack, List<ICard> playersCards, List<ICard> cardsOnTable, CardSuit? roundSuit )
    {
        var handWithoutPlayedCard = playersCards.Where(card => card != cardToPlay).ToArray();
        var minReqPoints = cardsOnTable.Where(card => card.Suit == firstOnStack.Suit).MaxBy(card => card.Points)!.Points;
        
        var isSuitValid = cardToPlay.Suit == firstOnStack.Suit;
        if (isSuitValid && (cardToPlay.Points > minReqPoints || !handWithoutPlayedCard.Any(card => card.Suit == cardToPlay.Suit && card.Points > minReqPoints))) 
        {
            return true;
        }
        var isTrumpValid = cardToPlay.Suit == roundSuit;
        if (isTrumpValid && handWithoutPlayedCard.All(card => card.Suit != firstOnStack.Suit))
        {
            return true;
        }
        var noOtherOption =
            playersCards.All(c => c.Suit != firstOnStack.Suit) &&
            playersCards.All(c => c.Suit != roundSuit);
        
        if (!noOtherOption) return false;
    
        return true;
    }
}