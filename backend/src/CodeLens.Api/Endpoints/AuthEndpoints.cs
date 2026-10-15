using CodeLens.Core.DTOs;
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

            if (request.Password.Length < 8)
            {
                return Results.BadRequest(new { error = "Password must be at least 8 characters long." });
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

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            {
                return Results.BadRequest(new { error = "Password must be at least 8 characters long." });
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
    }
}
