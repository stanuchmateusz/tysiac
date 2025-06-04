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

    public UserContext(IPlayer me ,IPlayer teammate, IPlayer leftPlayer, IPlayer rightPlayer, int myTeamScore, int opponentScore)
    {
        Me = me;
        Teammate = teammate;
        LeftPlayer = leftPlayer;
        RightPlayer = rightPlayer;
        TeammateCards = teammate.Hand.Count;
        LeftPlayerCards = leftPlayer.Hand.Count;
        RightPlayerCards = rightPlayer.Hand.Count;
        Hand = me.Hand;
        MyTeamScore = myTeamScore;
        OpponentScore = opponentScore;
    }
}