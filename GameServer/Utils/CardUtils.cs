using GameServer.Models;
using GameServer.Models.Enums;

namespace GameServer.Utils;

public static class CardUtils
{
    /// <summary>
    /// Gets the point value associated with a specific card suit when it is declared as trump.
    /// </summary>
    /// <param name="cardSuit">The card suit for which to get the trump points.</param>
    /// <returns>The point value of the suit when it is trump.</returns>
    /// <exception cref="ArgumentException">Thrown if the provided <paramref name="cardSuit"/> is not a valid suit for trump points (e.g., an undefined enum value).</exception>
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
    
    /// <summary>
    /// Identifies and returns a list of card suits for which the player holds both the Queen and the King.
    /// This is often relevant for declaring "marriages" or "trumps" in card games.
    /// </summary>
    /// <param name="cards">An enumerable collection of <see cref="ICard"/> representing the player's hand or a subset of cards to evaluate.</param>
    /// <returns>A list of <see cref="CardSuit"/> for which both a Queen and a King are present in the input <paramref name="cards"/>.
    /// Returns an empty list if no such suits are found or if the input collection is empty.</returns>
    /// <exception cref="ArgumentNullException">Thrown if the <paramref name="cards"/> collection is null.</exception>
    public static List<CardSuit> GetTrumps(IEnumerable<ICard> cards)
    {
        ArgumentNullException.ThrowIfNull(cards);
        
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
    
    /// <summary>
    /// Determines if a specific card can be legally played by a player in the current state of a trick.
    /// The rules are generally:
    /// 1. If the player has a card of the leading suit, they must play a card of that suit.
    ///    - If they can beat the highest card of the leading suit already played, they must do so.
    ///    - If they cannot beat the highest card but have other cards of the leading suit, they can play any of them.
    /// 2. If the player has no cards of the leading suit but has trump cards, they may play a trump card.
    /// 3. If the player has no cards of the leading suit and no trump cards, they may play any card.
    /// </summary>
    /// <param name="cardToPlay">The card the player intends to play.</param>
    /// <param name="firstOnStack">The first card played in the current trick, which determines the leading suit.</param>
    /// <param name="playersCards">The complete list of cards in the current player's hand.</param>
    /// <param name="cardsOnTable">The list of cards already played in the current trick.</param>
    /// <param name="roundSuit">The trump suit for the current round. Can be <c>null</c> if no trump is active.</param>
    /// <returns><c>true</c> if the <paramref name="cardToPlay"/> is a valid move according to the game rules; otherwise, <c>false</c>.</returns>
    public static bool CanPlay(ICard cardToPlay, ICard? firstOnStack, List<ICard> playersCards, List<ICard> cardsOnTable, CardSuit? roundSuit )
    {   if (firstOnStack == null)
        {
            return true; // If no card has been played yet, any card can be played.
        }
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
        
        return noOtherOption;
    }

    /// <summary>
    /// Identifies "half-trumps" in a player's hand.
    /// A "half-trump" is defined as a Queen or a King in a suit where the player does NOT hold both the Queen and King of that suit.
    /// </summary>
    /// <param name="botHand">The list of cards in the bot's hand to evaluate.</param>
    /// <returns>An <see cref="IEnumerable{T}"/> of <see cref="ICard"/> representing the identified half-trumps.
    /// Returns an empty enumerable if no half-trumps are found or if the input hand is empty.</returns>
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