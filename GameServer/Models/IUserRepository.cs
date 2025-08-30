namespace GameServer.Models;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByIdAsync(string id);
    Task CreateAsync(User user);
    Task<User?> FindByExternalLoginAsync(string provider, string providerUserId);
    Task<User?> GetByEmailAsync(string email);
    Task UpdateAsync(User user);
}