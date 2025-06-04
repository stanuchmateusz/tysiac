using GameServer.Models.impl;

namespace GameServer.Models;

public class UserContext
{
    public IPlayerBase Me { get; set; }         
    public IPlayerBase Teammate { get; set; } 
    public IPlayerBase LeftPlayer { get; set; } 
    public IPlayerBase RightPlayer { get; set; } 
    public int TeammateCards { get; }     // Cards held by teammate
    public int LeftPlayerCards { get; }    // Cards held by player to left
    public int RightPlayerCards { get; }   // Cards held by player to right
    public List<ICard> Hand { get; }  
    public int MyTeamScore { get; }        // Current team score
    public int OpponentScore { get; }

    public UserContext(IPlayerBase me ,IPlayerBase teammate, IPlayerBase leftPlayer, IPlayerBase rightPlayer, int teammateCards, int leftPlayerCards, int rightPlayerCards, List<ICard> hand, int myTeamScore, int opponentScore)
    {
        Me = me;
        Teammate = teammate;
        LeftPlayer = leftPlayer;
        RightPlayer = rightPlayer;
        TeammateCards = teammateCards;
        LeftPlayerCards = leftPlayerCards;
        RightPlayerCards = rightPlayerCards;
        Hand = hand;
        MyTeamScore = myTeamScore;
        OpponentScore = opponentScore;
    }
}