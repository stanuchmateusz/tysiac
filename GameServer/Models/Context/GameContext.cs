using GameServer.Models.impl;

namespace GameServer.Models.Context;

public class GameContext(
    IPlayerBase currentPlayer,
    GamePhase gamePhase,
    List<ICard> cardsOnTable,
    CardSuit trumpSuit,
    int musikCount,
    int currentBet)
{
    public IPlayerBase CurrentPlayer { get; } = currentPlayer;
    public GamePhase GamePhase { get; } = gamePhase;
    public List<ICard> CardsOnTable { get; } = cardsOnTable;
    public CardSuit TrumpSuit { get; } = trumpSuit;
    public int MusikCount { get; } = musikCount; //todo tu chyba bool wystarczy
    public int CurrentBet { get; } = currentBet; 
}