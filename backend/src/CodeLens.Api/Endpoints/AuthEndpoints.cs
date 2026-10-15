using CodeLens.Core.DTOs;
using CodeLens.Core.Interfaces;
using CodeLens.Infrastructure.Auth;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CodeLens.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // ── Register with Email / Password ────────────────────────────────────
        group.MapPost("/register", async (
            [FromBody] RegisterRequest request,
            [FromServices] AuthService authService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new { error = "Name, email, and password are required." });
            }

            var passwordError = ValidatePasswordPolicy(request.Password);
            if (passwordError != null)
            {
                return Results.BadRequest(new { error = passwordError });
            }

            try
            {
                var (token, user) = await authService.RegisterAsync(
                    request.Name, request.Email, request.Password, ct);

                return Results.Ok(new AuthResponse(
                    token, user.Id, user.Email, user.Name, user.AvatarUrl, user.AuthProviders));
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    title: "Registration failed",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        })
        .WithName("Register")
        .WithSummary("Register a new account with email and password")
        .AllowAnonymous();

        // ── Login with Email / Password ───────────────────────────────────────
        group.MapPost("/login", async (
            [FromBody] LoginRequest request,
            [FromServices] AuthService authService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest(new { error = "Email and password are required." });
            }

            try
            {
                var (token, user) = await authService.LoginAsync(request.Email, request.Password, ct);
                return Results.Ok(new AuthResponse(
                    token, user.Id, user.Email, user.Name, user.AvatarUrl, user.AuthProviders));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Problem(
                    title: "Invalid credentials",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status401Unauthorized);
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    title: "Login failed",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        })
        .WithName("Login")
        .WithSummary("Sign in with email and password")
        .AllowAnonymous();

        // ── Google OAuth Sign-In & Auto-Linking ───────────────────────────────
        group.MapPost("/google", async (
            [FromBody] GoogleAuthRequest request,
            [FromServices] AuthService authService,
            CancellationToken ct) =>
        {
            try
            {
                var (token, user) = await authService.AuthenticateGoogleAsync(request.IdToken, ct);
                return Results.Ok(new AuthResponse(
                    token, user.Id, user.Email, user.Name, user.AvatarUrl, user.AuthProviders));
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    title: "Google authentication failed",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status401Unauthorized);
            }
        })
        .WithName("AuthenticateGoogle")
        .WithSummary("Exchange a Google id_token for a CodeLens backend JWT")
        .AllowAnonymous();

        // ── Explicit Link Google Account ──────────────────────────────────────
        group.MapPost("/link-google", async (
            [FromBody] LinkGoogleRequest request,
            ClaimsPrincipal principal,
            [FromServices] AuthService authService,
            CancellationToken ct) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue("sub");

            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            try
            {
                var user = await authService.LinkGoogleAsync(userId, request.IdToken, ct);
                var token = authService.IssueJwt(user);
                return Results.Ok(new AuthResponse(
                    token, user.Id, user.Email, user.Name, user.AvatarUrl, user.AuthProviders));
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    title: "Account linking failed",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }
        })
        .WithName("LinkGoogle")
        .WithSummary("Link a Google account to the currently authenticated user")
        .RequireAuthorization();

        // ── Explicit Set Password ─────────────────────────────────────────────
        group.MapPost("/set-password", async (
            [FromBody] SetPasswordRequest request,
            ClaimsPrincipal principal,
            [FromServices] AuthService authService,
            CancellationToken ct) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue("sub");

            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            var passwordError = ValidatePasswordPolicy(request.Password);
            if (passwordError != null)
            {
                return Results.BadRequest(new { error = passwordError });
            }

            try
            {
                var user = await authService.SetPasswordAsync(userId, request.Password, ct);
                var token = authService.IssueJwt(user);
                return Results.Ok(new AuthResponse(
                    token, user.Id, user.Email, user.Name, user.AvatarUrl, user.AuthProviders));
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    title: "Setting password failed",
                    detail: ex.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }
        })
        .WithName("SetPassword")
        .WithSummary("Set a local password for the currently authenticated user")
        .RequireAuthorization();

        // ── Delete All Users (Reset / Cleanup) ───────────────────────────────
        group.MapDelete("/users", async (
            [FromServices] ICosmosRepository repository,
            CancellationToken ct) =>
        {
            var count = await repository.DeleteAllUsersAsync(ct);
            return Results.Ok(new { message = "All users deleted successfully.", deletedCount = count });
        })
        .WithName("DeleteAllUsers")
        .WithSummary("Delete all users from the database")
        .AllowAnonymous();
    }

    private static string? ValidatePasswordPolicy(string? password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return "Password is required.";
        }

        if (password.Length < 8)
        {
            return "Password must be at least 8 characters long.";
        }

        if (!password.Any(char.IsUpper))
        {
            return "Password must contain at least one uppercase letter (A-Z).";
        }

        if (!password.Any(char.IsLower))
        {
            return "Password must contain at least one lowercase letter (a-z).";
        }

        if (!password.Any(char.IsDigit))
        {
            return "Password must contain at least one number (0-9).";
        }

        if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            return "Password must contain at least one special character (e.g. !@#$%^&*).";
        }

        return null;
    }
}
