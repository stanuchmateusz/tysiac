using GameServer.Models.Enums;
using GameServer.Models.impl;

namespace GameServer.Models.Context;

public class GameContext(
    IPlayerBase currentPlayer,
    GamePhase gamePhase,
    List<ICard> cardsOnTable,
    CardSuit trumpSuit,
    int currentBet,
    HashSet<IPlayer> disconnectedPlayers,
    HashSet<IPlayer> passedPlayers,
    IPlayer? takeWinner
    )
{
    public IPlayerBase CurrentPlayer { get; } = currentPlayer;
    public GamePhase GamePhase { get; } = gamePhase;
    public List<ICard> CardsOnTable { get; } = cardsOnTable;
    public CardSuit TrumpSuit { get; } = trumpSuit;
    public int CurrentBet { get; } = currentBet;
    public  HashSet<IPlayer>DisconnectedPlayers { get; } = disconnectedPlayers;
    public HashSet<IPlayer> PassedPlayers { get; } = passedPlayers;
    public IPlayer? TakeWinner { get; } = takeWinner;

}