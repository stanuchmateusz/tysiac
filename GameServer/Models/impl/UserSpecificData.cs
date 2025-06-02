namespace GameServer.Models.impl;

public class UserSpecificData
{
    private int TeammateCards { get; }
    private int leftPlayerCards { get; }
    private int rightPlayerCards { get; }
    private int musik { get; }
    private int currentBet { get; }
    private int my { get; }
    private int wy { get; }

    public UserSpecificData(int teammateCards, int leftPlayerCards, int rightPlayerCards, int musik, int currentBet, int my, int wy)
    {
        this.TeammateCards = teammateCards;
        this.leftPlayerCards = leftPlayerCards;
        this.rightPlayerCards = rightPlayerCards;
        this.musik = musik;
        this.currentBet = currentBet;
        this.my = my;
        this.wy = wy;
    }
}