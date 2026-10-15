using CodeLens.Api.Endpoints;
using CodeLens.Infrastructure.Auth;
using CodeLens.Infrastructure.Data;
using CodeLens.Core.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Azure.Cosmos;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration binding ──────────────────────────────────────────────────────
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection("Google"));
builder.Services.Configure<CosmosDbOptions>(builder.Configuration.GetSection("CosmosDb"));
builder.Services.Configure<BlobStorageOptions>(builder.Configuration.GetSection("BlobStorage"));

// ── JWT Bearer Authentication ─────────────────────────────────────────────────
var jwtConfig = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
var secretKey = string.IsNullOrWhiteSpace(jwtConfig.Secret)
    ? "codelens-super-secret-key-for-development-purposes-must-be-32-chars-minimum"
    : jwtConfig.Secret;

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

// ── CORS (allow frontend dev server) ──────────────────────────────────────────
builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy =>
{
    policy.WithOrigins(
        builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
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
app.MapAuthEndpoints();
app.MapAuditEndpoints();
app.MapChatEndpoints();

app.Run();
