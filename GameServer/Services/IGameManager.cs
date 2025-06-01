using System.Collections.ObjectModel;
using GameServer.Models.impl;
using GameServer.Services;

namespace GameServer.Models;

public interface IGameManager
{    
     public TableService? GetRoom(string roomCode);
     public string CreateRoom(IPlayer player);
     public void JoinRoom(string roomCode, IPlayer player);
     public IList<IPlayer> GetPlayers(string roomCode);
     bool LeaveRoom(string roomCode,string contextConnectionId );
     void Disconnect(string contextConnectionId);
}