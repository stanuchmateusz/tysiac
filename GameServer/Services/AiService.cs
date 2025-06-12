using GameServer.Models;
using GameServer.Models.Enums;
using GameServer.Models.impl;
using GameServer.Utils;
using Serilog;

namespace GameServer.Services;

public static class AiService
{
    
    public static void ProcessTurn(GameService gameService , AIPlayer player)
    {
        
        var gameCtx = gameService.GetGameState();
        var userCtx = gameService.GetUserState(player);
        Log.Information("Game Stage {Stage}",gameCtx.GamePhase );
        Log.Information("Processing move for {Botname}", userCtx.Me.Nickname);
        switch (gameCtx.GamePhase)
        {
            case GamePhase.Auction:
            {
                var currentBid = gameCtx.CurrentBet;
                var botHand = userCtx.Hand;
                var maxBid = 200;
                var hasPair = botHand
                    .GroupBy(card => card.Suit)
                    .Any(g => g.Any(c => c.Rank == CardRank.Queen) && g.Any(c => c.Rank == CardRank.King));
                var random = new Random().Next(1) == 0;
                if ( (random ||hasPair) && currentBid + 10 <= maxBid)
                {
                    gameService.PlaceBid(player, currentBid + 10);
                    Log.Information("Bot bids {Bid}", currentBid + 10);
                }
                else
                {
                    gameService.PassBid(player);
                    Log.Information("Bot passes");
                }
                break;
            }
            case GamePhase.CardDistribution:
            {
                var botHand = userCtx.Hand;
                List<IPlayer> validPlayers = [];
                if (userCtx.LeftPlayerCards == 5)
                    gameService.DistributeCard(player, botHand.First().ShortName,  gameService.GetPlayerFromRoom(userCtx.LeftPlayer.ConnectionId));
                else if (userCtx.TeammateCards == 5)
                    gameService.DistributeCard(player, botHand.First().ShortName
                        , gameService.GetPlayerFromRoom(userCtx.Teammate.ConnectionId));
                else if (userCtx.RightPlayerCards == 5)
                {
                    gameService.DistributeCard(player, botHand.First().ShortName, gameService.GetPlayerFromRoom(userCtx.RightPlayer.ConnectionId));
                }
                break;
            }
            case GamePhase.Playing:
            {
                var botHand = userCtx.Hand;
                var validCards = botHand.Where(card => gameCtx.CardsOnTable.Count > 0 && CardUtils.CanPlay(card, gameCtx.CardsOnTable.First(), botHand,
                    gameCtx.CardsOnTable, gameCtx.TrumpSuit)).ToList();
                var card = validCards.Count != 0 ? validCards[0] : botHand[0];
                gameService.PlayCard(player, card);
                Log.Information("Bot plays {Card}", card);
                
                break;
            }
            case GamePhase.Start:
            case GamePhase.GameOver:
            case GamePhase.ShowTable:
            default:
            {
                Log.Information("Game Phase {Phase}", gameCtx.GamePhase);
                break;
            }
        }
    }
}