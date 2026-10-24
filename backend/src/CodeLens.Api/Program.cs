using CodeLens.Api.Endpoints;
using CodeLens.Infrastructure.Auth;
using CodeLens.Infrastructure.Data;
using CodeLens.Core.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Azure.Cosmos;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

using CodeLens.Infrastructure.GitHub;
using CodeLens.Infrastructure.Analysis;
using CodeLens.Infrastructure.AI;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration binding ──────────────────────────────────────────────────────
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<CosmosDbOptions>(builder.Configuration.GetSection("CosmosDb"));
builder.Services.Configure<BlobStorageOptions>(builder.Configuration.GetSection("BlobStorage"));
builder.Services.Configure<GitHubOptions>(builder.Configuration.GetSection("GitHub"));
builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection("Gemini"));

// ── HTTP Client & Ingestion Engines ───────────────────────────────────────────
builder.Services.AddHttpClient();
builder.Services.AddScoped<IGitHubTelemetryService, OctokitTelemetryService>();
builder.Services.AddScoped<ICodeAnalysisService, RoslynAndPolyglotAnalyzer>();
builder.Services.AddScoped<IGeminiSynthesisService, GeminiSynthesisService>();

// ── JWT Bearer Authentication ─────────────────────────────────────────────────
var jwtConfig = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
var secretKey = jwtConfig.Secret;
if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Contains("REPLACE_WITH"))
{
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "JWT secret key is not configured for production. Set the 'Jwt:Secret' configuration key or 'JWT__SECRET' environment variable with at least 32 characters.");
    }

    secretKey = "codelens-super-secret-key-for-development-purposes-must-be-32-chars-minimum";
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig.Issuer,
            ValidAudience = jwtConfig.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(secretKey)),
        };
    });

builder.Services.AddAuthorization();

// ── Storage & DB Registrations (with Local In-Memory Fallbacks) ───────────────
var cosmosOptions = builder.Configuration.GetSection("CosmosDb").Get<CosmosDbOptions>();
bool hasValidCosmos = !string.IsNullOrWhiteSpace(cosmosOptions?.ConnectionString) &&
    !cosmosOptions.ConnectionString.Contains("REPLACE_WITH");

if (hasValidCosmos)
{
    builder.Services.AddSingleton(sp =>
    {
        return new CosmosClient(cosmosOptions!.ConnectionString, new CosmosClientOptions
        {
            SerializerOptions = new CosmosSerializationOptions
            {
                PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase,
            },
        });
    });
    builder.Services.AddScoped<ICosmosRepository, CosmosRepository>();
}
else
{
    // Use in-memory repository for local development when Azure Cosmos DB is not yet provisioned
    builder.Services.AddSingleton<ICosmosRepository, InMemoryCosmosRepository>();
}

var blobOptions = builder.Configuration.GetSection("BlobStorage").Get<BlobStorageOptions>();
bool hasValidBlob = !string.IsNullOrWhiteSpace(blobOptions?.ConnectionString) &&
    !blobOptions.ConnectionString.Contains("REPLACE_WITH");

if (hasValidBlob)
{
    builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
}
else
{
    // Use in-memory blob storage service for local development when Azure Blob Storage is not yet provisioned
    builder.Services.AddSingleton<IBlobStorageService, InMemoryBlobStorageService>();
}

builder.Services.AddScoped<AuthService>();

// ── CORS (allow frontend dev server and production domains) ────────────────
builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy =>
{
    var rawAllowedOrigins = builder.Configuration["AllowedOrigins"];
    if (string.IsNullOrWhiteSpace(rawAllowedOrigins) || rawAllowedOrigins == "*")
    {
        policy.SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    }
    else
    {
        var origins = rawAllowedOrigins
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        policy.WithOrigins(origins)
            .SetIsOriginAllowed(origin =>
            {
                if (origins.Contains(origin, StringComparer.OrdinalIgnoreCase)) return true;
                // Automatically permit Azure Static Web Apps domains and localhost
                if (origin.EndsWith(".azurestaticapps.net", StringComparison.OrdinalIgnoreCase) ||
                    origin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    }
}));

// ── OpenAPI / Scalar ──────────────────────────────────────────────────────────
builder.Services.AddOpenApi();

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ── Endpoint registration ─────────────────────────────────────────────────────
app.MapGet("/healthz", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTimeOffset.UtcNow,
    environment = app.Environment.EnvironmentName
}))
.AllowAnonymous()
.WithTags("Health")
.WithName("HealthCheck")
.WithSummary("API liveness and health check probe");

app.MapAuthEndpoints();
app.MapAuditEndpoints();
app.MapChatEndpoints();

app.Run();
