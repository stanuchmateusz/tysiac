using GameServer.Models.Enums;

namespace GameServer.Models;

public class RoundSummary(
    int roundBet,
    bool didWeWonBet,
    int myTeamScoreFromCards,
    int opponentScoreFromCards,
    CardSuit[] myTeamMeldSuits,
    CardSuit[] opponentMeldSuits,
    int myTeamFinalScore,
    int opponentFinalScore)
{
    public int RoundBet { get; } = roundBet;
    public bool DidWeWonBet { get; } = didWeWonBet;
    public int MyTeamScoreFromCards { get; } = myTeamScoreFromCards;
    public int OpponentScoreFromCards { get; } = opponentScoreFromCards;
    public CardSuit[] MyTeamMeldSuits { get; } = myTeamMeldSuits;
    public CardSuit[] OpponentMeldSuits { get; } = opponentMeldSuits;
    public int MyTeamFinalScore { get; } = myTeamFinalScore;
    public int OpponentFinalScore { get; } = opponentFinalScore;
}