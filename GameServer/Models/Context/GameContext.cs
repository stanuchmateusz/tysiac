using GameServer.Models.Enums;
using GameServer.Models.impl;

namespace GameServer.Models.Context;

public class GameContext(
    IPlayerBase currentPlayer,
    GamePhase gamePhase,
    List<ICard> cardsOnTable,
    CardSuit trumpSuit,
    int currentBet,
    int disconnectedPlayerCount
    )
{
    public IPlayerBase CurrentPlayer { get; } = currentPlayer;
    public GamePhase GamePhase { get; } = gamePhase;
    public List<ICard> CardsOnTable { get; } = cardsOnTable;
    public CardSuit TrumpSuit { get; } = trumpSuit;
    public int CurrentBet { get; } = currentBet;
    public int DisconnectedPlayerCount { get; } = disconnectedPlayerCount;
}