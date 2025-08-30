using GameServer.Models;
using MongoDB.Driver;

namespace GameServer.Data;

public class UserMongoDbRepository : IUserRepository
{
    private readonly IMongoCollection<User> _users;

    public UserMongoDbRepository(IMongoClient client)
    {
        var db = client.GetDatabase("GameDatabase");
        _users = db.GetCollection<User>("Users");
        
        var indexKeys = Builders<User>.IndexKeys.Ascending(u => u.Email);
        var indexOptions = new CreateIndexOptions { Unique = true };
        var indexModel = new CreateIndexModel<User>(indexKeys, indexOptions);
        _users.Indexes.CreateOne(indexModel);
    }

    public Task<User?> GetByUsernameAsync(string username) =>
        _users.Find(u => u.Username == username).FirstOrDefaultAsync();

    public Task<User?> GetByIdAsync(string id) =>
        _users.Find(u => u.Id == id).FirstOrDefaultAsync();

    public Task CreateAsync(User user) =>
        _users.InsertOneAsync(user);
    
    public Task<User?> GetByEmailAsync(string email) =>
        _users.Find(u => u.Email == email).FirstOrDefaultAsync();
    
    public Task UpdateAsync(User user) =>
        _users.ReplaceOneAsync(u => u.Id == user.Id, user);
    
    public Task<User?> FindByExternalLoginAsync(string provider, string providerUserId) =>
        _users.Find(u => u.ExternalLogins.Any(x => x.Provider == provider && x.ProviderUserId == providerUserId))
            .FirstOrDefaultAsync();

}
