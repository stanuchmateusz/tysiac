using GameServer.Models.impl;

namespace GameServer.Models.Context;

public class GameContext
{
    public IPlayerBase currentPlayer;
    public GamePhase gamePhase;
    public List<ICard> cardsOnTable;
    public int MusikCount { get; }         // Cards remaining in musik
    public int CurrentBet { get; }         // Current highest bid
    
    public GameContext(IPlayerBase currentPlayer, GamePhase gamePhase, List<ICard> cardsOnTable, int musikCount, int currentBet)
    {
        this.currentPlayer = currentPlayer;
        this.gamePhase = gamePhase;
        this.cardsOnTable = cardsOnTable;
        MusikCount = musikCount;
        CurrentBet = currentBet;
    }
}