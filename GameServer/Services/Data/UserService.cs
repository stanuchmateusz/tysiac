using GameServer.Models;

namespace GameServer.Services;

public class UserService
{
    private readonly IUserRepository _users;
    
    public UserService(IUserRepository users)
    {
        _users = users;
    }
    
    public async Task<UserDto?> getUserById(string id)
    {
        var user = await _users.GetByIdAsync(id);
        return user == null ? null : new UserDto(user.Id,user.Username, user.Email);
    }

    public async Task<UserDto?> getUserByEmail(string email)
    {
        var user = await _users.GetByEmailAsync(email);
        return user == null ? null : new UserDto(user.Id,user.Username, user.Email);
    }
    

}
public record UserDto(string Id, string Username, string Email);