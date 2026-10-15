using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace CodeLens.Infrastructure.Data;

public sealed class CosmosDbOptions
{
    public string ConnectionString { get; set; } = default!;
    public string DatabaseName { get; set; } = "CodeLensDB";
    public string UsersContainer { get; set; } = "Users";
    public string AuditsContainer { get; set; } = "Audits";
    public string ChatContainer { get; set; } = "ChatSessions";
}

public sealed class CosmosRepository : ICosmosRepository
{
    private readonly CosmosClient _client;
    private readonly CosmosDbOptions _options;

    public CosmosRepository(CosmosClient client, IOptions<CosmosDbOptions> options)
    {
        _client = client;
        _options = options.Value;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Container GetContainer(string name) =>
        _client.GetContainer(_options.DatabaseName, name);

    // ── Users ─────────────────────────────────────────────────────────────────

    public async Task<UserDocument?> GetUserByEmailAsync(string email, CancellationToken ct = default)
    {
        var container = GetContainer(_options.UsersContainer);
        var query = new QueryDefinition("SELECT * FROM c WHERE c.email = @email")
            .WithParameter("@email", email);

        using var iterator = container.GetItemQueryIterator<UserDocument>(query);
        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            var user = page.FirstOrDefault();
            if (user is not null) return user;
        }

        return null;
    }

    public async Task<UserDocument?> GetUserByIdAsync(string id, CancellationToken ct = default)
    {
        var container = GetContainer(_options.UsersContainer);
        try
        {
            var response = await container.ReadItemAsync<UserDocument>(
                id, new PartitionKey(id), cancellationToken: ct);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<UserDocument> UpsertUserAsync(UserDocument user, CancellationToken ct = default)
    {
        var container = GetContainer(_options.UsersContainer);
        var response = await container.UpsertItemAsync(user, new PartitionKey(user.Id), cancellationToken: ct);
        return response.Resource;
    }

    public async Task<int> DeleteAllUsersAsync(CancellationToken ct = default)
    {
        var container = GetContainer(_options.UsersContainer);
        var query = new QueryDefinition("SELECT c.id FROM c");
        var ids = new List<string>();

        using var iterator = container.GetItemQueryIterator<UserDocument>(query);
        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            ids.AddRange(page.Select(u => u.Id));
        }

        var deleted = 0;
        foreach (var id in ids)
        {
            try
            {
                await container.DeleteItemAsync<UserDocument>(id, new PartitionKey(id), cancellationToken: ct);
                deleted++;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // Already deleted
            }
        }

        return deleted;
    }

    // ── Audits ────────────────────────────────────────────────────────────────

    public async Task<AuditDocument?> GetAuditAsync(string auditId, string? repositoryId = null, CancellationToken ct = default)
    {
        var container = GetContainer(_options.AuditsContainer);
        if (!string.IsNullOrWhiteSpace(repositoryId))
        {
            try
            {
                var response = await container.ReadItemAsync<AuditDocument>(
                    auditId, new PartitionKey(repositoryId), cancellationToken: ct);
                return response.Resource;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        var query = new QueryDefinition("SELECT * FROM c WHERE c.id = @auditId")
            .WithParameter("@auditId", auditId);

        using var iterator = container.GetItemQueryIterator<AuditDocument>(query);
        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            var item = page.FirstOrDefault();
            if (item is not null) return item;
        }

        return null;
    }

    public async Task<AuditDocument> UpsertAuditAsync(AuditDocument audit, CancellationToken ct = default)
    {
        var container = GetContainer(_options.AuditsContainer);
        var response = await container.UpsertItemAsync(
            audit, new PartitionKey(audit.RepositoryId), cancellationToken: ct);
        return response.Resource;
    }

    public async Task<IReadOnlyList<AuditDocument>> GetAuditsByUserAsync(string userId, CancellationToken ct = default)
    {
        var container = GetContainer(_options.AuditsContainer);
        var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC")
            .WithParameter("@userId", userId);

        var results = new List<AuditDocument>();
        using var iterator = container.GetItemQueryIterator<AuditDocument>(query);
        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            results.AddRange(page);
        }

        return results.AsReadOnly();
    }

    // ── Chat ──────────────────────────────────────────────────────────────────

    public async Task<ChatMessageDocument> SaveMessageAsync(ChatMessageDocument message, CancellationToken ct = default)
    {
        var container = GetContainer(_options.ChatContainer);
        var response = await container.CreateItemAsync(
            message, new PartitionKey(message.AuditId), cancellationToken: ct);
        return response.Resource;
    }

    public async Task<IReadOnlyList<ChatMessageDocument>> GetMessagesForAuditAsync(string auditId, CancellationToken ct = default)
    {
        var container = GetContainer(_options.ChatContainer);
        var query = new QueryDefinition("SELECT * FROM c WHERE c.auditId = @auditId ORDER BY c.timestamp ASC")
            .WithParameter("@auditId", auditId);

        var results = new List<ChatMessageDocument>();
        using var iterator = container.GetItemQueryIterator<ChatMessageDocument>(query, requestOptions: new QueryRequestOptions
        {
            PartitionKey = new PartitionKey(auditId),
        });

        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            results.AddRange(page);
        }

        return results.AsReadOnly();
    }
}
