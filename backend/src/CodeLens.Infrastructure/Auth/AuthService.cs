using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CodeLens.Infrastructure.Auth;

public sealed class JwtOptions
{
    public string Secret { get; set; } = default!;
    public string Issuer { get; set; } = "CodeLensApi";
    public string Audience { get; set; } = "CodeLensClient";
    public int ExpiryMinutes { get; set; } = 1440; // 24 hours
}

/// <summary>
/// Authentication service supporting email/password and JWT issuance.
/// </summary>
public sealed class AuthService(
    ICosmosRepository repository,
    IOptions<JwtOptions> jwtOptions)
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    // ── Email / Password Registration ──────────────────────────────────────────

    public async Task<(string Token, UserDocument User)> RegisterAsync(
        string name,
        string email,
        string password,
        CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var existingUser = await repository.GetUserByEmailAsync(normalizedEmail, ct);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("An account with this email already exists. Please sign in.");
        }

        var newUser = new UserDocument
        {
            Id = $"usr_{Guid.NewGuid():N}",
            Email = normalizedEmail,
            Name = name.Trim(),
            PasswordHash = HashPassword(password),
            AuthProviders = ["credentials"],
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var saved = await repository.UpsertUserAsync(newUser, ct);
        var jwt = IssueJwt(saved);
        return (jwt, saved);
    }

    // ── Email / Password Login ────────────────────────────────────────────────

    public async Task<(string Token, UserDocument User)> LoginAsync(
        string email,
        string password,
        CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await repository.GetUserByEmailAsync(normalizedEmail, ct);

        if (user is null || string.IsNullOrEmpty(user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!VerifyPassword(password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var token = IssueJwt(user);
        return (token, user);
    }


    // ── Explicit Set Password (for OAuth users adding credentials) ────────────

    public async Task<UserDocument> SetPasswordAsync(
        string userId,
        string password,
        CancellationToken ct = default)
    {
        var user = await repository.GetUserByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        user.PasswordHash = HashPassword(password);
        if (!user.AuthProviders.Contains("credentials"))
        {
            user.AuthProviders.Add("credentials");
        }

        return await repository.UpsertUserAsync(user, ct);
    }

    // ── JWT Issuance ──────────────────────────────────────────────────────────

    public string IssueJwt(UserDocument user)
    {
        var secret = string.IsNullOrWhiteSpace(_jwt.Secret)
            ? "codelens-super-secret-key-for-development-purposes-must-be-32-chars-minimum"
            : _jwt.Secret;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.Name ?? user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
        };

        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            claims.Add(new Claim("picture", user.AvatarUrl));
        }

        foreach (var provider in user.AuthProviders)
        {
            claims.Add(new Claim("auth_provider", provider));
        }

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ── PBKDF2 Password Hashing (Salt + 100,000 iterations + SHA512) ──────────

    private static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16); // 128-bit salt
        byte[] subkey = KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA512,
            iterationCount: 100_000,
            numBytesRequested: 32); // 256-bit subkey

        var outputBytes = new byte[1 + 4 + 16 + 32];
        outputBytes[0] = 0x01; // Format marker version 1
        WriteNetworkByteOrder(outputBytes, 1, 100_000);
        Buffer.BlockCopy(salt, 0, outputBytes, 5, 16);
        Buffer.BlockCopy(subkey, 0, outputBytes, 21, 32);

        return Convert.ToBase64String(outputBytes);
    }

    private static bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            byte[] decoded = Convert.FromBase64String(hashedPassword);
            if (decoded.Length != 1 + 4 + 16 + 32 || decoded[0] != 0x01)
            {
                return false;
            }

            uint iterationCount = ReadNetworkByteOrder(decoded, 1);
            byte[] salt = new byte[16];
            Buffer.BlockCopy(decoded, 5, salt, 0, 16);

            byte[] expectedSubkey = new byte[32];
            Buffer.BlockCopy(decoded, 21, expectedSubkey, 0, 32);

            byte[] actualSubkey = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA512,
                iterationCount: (int)iterationCount,
                numBytesRequested: 32);

            return CryptographicOperations.FixedTimeEquals(actualSubkey, expectedSubkey);
        }
        catch
        {
            return false;
        }
    }

    private static void WriteNetworkByteOrder(byte[] buffer, int offset, uint value)
    {
        buffer[offset + 0] = (byte)(value >> 24);
        buffer[offset + 1] = (byte)(value >> 16);
        buffer[offset + 2] = (byte)(value >> 8);
        buffer[offset + 3] = (byte)(value >> 0);
    }

    private static uint ReadNetworkByteOrder(byte[] buffer, int offset)
    {
        return ((uint)buffer[offset + 0] << 24)
            | ((uint)buffer[offset + 1] << 16)
            | ((uint)buffer[offset + 2] << 8)
            | (uint)buffer[offset + 3];
    }
}
