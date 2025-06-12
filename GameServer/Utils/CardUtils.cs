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

    public static List<CardSuit> GetTrumps(IEnumerable<ICard> cards)
    {
        if (cards == null) throw new ArgumentNullException(nameof(cards));  
        List<CardSuit> cardSuits = [];
        foreach (var g in cards.GroupBy(card => card.Suit))
        {
            if (g.Any(c => c.Rank == CardRank.Queen) && g.Any(c => c.Rank == CardRank.King))
            {
                cardSuits.Add(g.Key);
            }
        }
        return cardSuits;
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

    public static IEnumerable<ICard> GetHalfTrumps(List<ICard> botHand)
    {
        var suitsToSkip = GetTrumps(botHand); 
        return botHand.Where(c => !suitsToSkip.Contains(c.Suit) && c.Rank is CardRank.Queen or CardRank.King);
    }

    public static ICard GetCardToPlay(List<ICard> candidateCards, ICard? firstCardOnTrick)
    {
        if (candidateCards == null || candidateCards.Count == 0)
        {
            throw new ArgumentException("List of candidate cards cannot be null or empty.", nameof(candidateCards));
        }
        
        if (candidateCards.Count == 1)
        {
            return candidateCards[0];
        }

        // Preference 1: "try to play queen when cardOnTable.Suit != card.Suit"
        // This applies if following a card and a Queen can be played off-suit (as trump or discard).
        if (firstCardOnTrick != null)
        {
            var preferredQueenPlays = candidateCards
                .Where(card => card.Rank == CardRank.Queen && card.Suit != firstCardOnTrick.Suit)
                .ToList();

            if (preferredQueenPlays.Count != 0)
            {
                return preferredQueenPlays[0];
            }
        }
        var nonKingOptions = candidateCards
            .Where(card => card.Rank != CardRank.King)
            .OrderBy(card => card.Points) // Prefer lower point non-King cards
            .ToList();

        if (nonKingOptions.Count != 0)
        {
            return nonKingOptions[0];
        }

        // Fallback: If no preferred Queen play was made and all remaining/available options are Kings,
        // or if leading and all options are Kings.
        // Play the lowest point card from the (remaining) candidates.
        return candidateCards.OrderBy(card => card.Points).First();
    }
}