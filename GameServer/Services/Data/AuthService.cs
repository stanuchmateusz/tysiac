using GameServer.Models;
using GameServer.Utils;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;

namespace GameServer.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

public class AuthService
{
    private readonly IUserRepository _users;
    private readonly JwtSettings _jwtSettings;
    private readonly GoogleSettings _google;


    public AuthService(IUserRepository users, IOptions<JwtSettings> jwtOptions, IOptions<GoogleSettings> googleOptions)
    {
        _users = users;
        _jwtSettings = jwtOptions.Value;
        _google = googleOptions.Value;
    }

    public async Task<string?> LoginAsync(string email, string password, bool rememberMe = false)
    {
        var user = await _users.GetByEmailAsync(email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username)
        };
        claims.AddRange(user.Roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: rememberMe ? DateTime.UtcNow.AddDays(7) : DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<User?> RegisterAsync(string username, string email, string password)
    {
        if (await _users.GetByUsernameAsync(username) != null)
            return null;

        if (await _users.GetByEmailAsync(email) != null)
            return null;
        
        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Roles = ["User"]
        };

        await _users.CreateAsync(user);
        return user;
    }

    public async Task<string?> LoginWithGoogleAsync(string dtoIdToken)
    {
        var payload = await GoogleJsonWebSignature.ValidateAsync(dtoIdToken,
            new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [ _google.ClientId ]
            });
        if (payload == null)
            return null;

        return await LoginWithExternalAsync("Google", payload.Subject, payload.Email, payload.Name);
    }

    public async Task<string> LoginWithExternalAsync(string provider, string providerUserId, string email, string? name)
    {
        var user = await _users.FindByExternalLoginAsync(provider, providerUserId);

        if (user != null)
            return IssueJwt(user);

        user = await _users.GetByEmailAsync(email);
        if (user != null)
        {
            user.ExternalLogins.Add(new ExternalLogin
            {
                Provider = provider,
                ProviderUserId = providerUserId
            });
            await _users.UpdateAsync(user);
        }
        else
        {
            user = new User
            {
                Username = await GenerateUniqueUsernameAsync(name ?? email.Split('@')[0]),
                Email = email,
                Roles = new[] { "User" },
                ExternalLogins = new List<ExternalLogin>
                {
                    new() { Provider = provider, ProviderUserId = providerUserId }
                }
            };
            await _users.CreateAsync(user);
        }

        return IssueJwt(user);
    }
    
    public async Task<bool> ChangePasswd(string dtoEmail, string dtoOldPassword, string dtoNewPassword)
    {
        var user = _users.GetByEmailAsync(dtoEmail).Result;
        if (user == null)
            return false;
        if (!BCrypt.Net.BCrypt.Verify(dtoOldPassword, user.PasswordHash))
            return false;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dtoNewPassword);
        await _users.UpdateAsync(user);
        return true;
    }

    private async Task<string> GenerateUniqueUsernameAsync(string baseName)
    {
        var candidate = baseName;
        var i = 0;
        while (await _users.GetByUsernameAsync(candidate) != null)
        {
            i++;
            candidate = $"{baseName}{i}";
        }

        return candidate;
    }

    private string IssueJwt(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username)
        };
        claims.AddRange(user.Roles.Select(r => new Claim(ClaimTypes.Role, r)));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

   
}