using GameServer.Services;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;

namespace GameServer.Controllers;
using Microsoft.AspNetCore.Mvc;
using BCrypt.Net;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth)
    {
        _auth = auth;
    }

    [Authorize]
    [HttpGet]
    public IActionResult CheckAuth() => Ok();
    
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var user = await _auth.RegisterAsync(dto.Username, dto.Email, dto.Password);
            if (user == null) return BadRequest("User already exists");
            
            var token = await _auth.LoginAsync(user.Email, dto.Password);
            if (token == null) return Unauthorized();
            return Ok(new { token });
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return Conflict("Email already in use");
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var token = await _auth.LoginAsync(dto.Email, dto.Password, dto.RememberMe ?? false);
        if (token == null) return Unauthorized();
        return Ok(new { token });
    }
    
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        var token = await _auth.LoginWithGoogleAsync(dto.IdToken);
        if (token == null) return Unauthorized();
        return Ok(new { token });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePasswd([FromBody] ChangePasswdDto dto)
    {
        var result = await _auth.ChangePasswd(dto.Email, dto.OldPassword, dto.NewPassword);
        if (!result)
            return Unauthorized();
        return Ok();
    }
}
public record ChangePasswdDto(string Email,string OldPassword, string NewPassword);
public record RegisterDto(string Username, string Email, string Password);
public record LoginDto(string Email, string Password, bool? RememberMe);
public record GoogleLoginDto(string IdToken);