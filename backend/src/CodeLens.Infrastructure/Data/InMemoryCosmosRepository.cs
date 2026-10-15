using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using System.Collections.Concurrent;

namespace CodeLens.Infrastructure.Data;

/// <summary>
/// In-memory implementation of ICosmosRepository for local development
/// when a real Azure Cosmos DB connection string is not provided.
/// </summary>
public sealed class InMemoryCosmosRepository : ICosmosRepository
{
    private readonly ConcurrentDictionary<string, UserDocument> _usersById = new();
    private readonly ConcurrentDictionary<string, UserDocument> _usersByEmail = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, AuditDocument> _audits = new();
    private readonly ConcurrentDictionary<string, List<ChatMessageDocument>> _messagesByAudit = new();

    public Task<UserDocument?> GetUserByEmailAsync(string email, CancellationToken ct = default)
    {
        _usersByEmail.TryGetValue(email, out var user);
        return Task.FromResult(user);
    }

    public Task<UserDocument?> GetUserByIdAsync(string id, CancellationToken ct = default)
    {
        _usersById.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }

    public Task<UserDocument> UpsertUserAsync(UserDocument user, CancellationToken ct = default)
    {
        _usersById[user.Id] = user;
        _usersByEmail[user.Email] = user;
        return Task.FromResult(user);
    }

    public Task<int> DeleteAllUsersAsync(CancellationToken ct = default)
    {
        var count = _usersById.Count;
        _usersById.Clear();
        _usersByEmail.Clear();
        return Task.FromResult(count);
    }

    public Task<AuditDocument?> GetAuditAsync(string auditId, string? repositoryId = null, CancellationToken ct = default)
    {
        _audits.TryGetValue(auditId, out var audit);
        return Task.FromResult(audit);
    }

    public Task<AuditDocument> UpsertAuditAsync(AuditDocument audit, CancellationToken ct = default)
    {
        _audits[audit.Id] = audit;
        return Task.FromResult(audit);
    }

    public Task<IReadOnlyList<AuditDocument>> GetAuditsByUserAsync(string userId, CancellationToken ct = default)
    {
        var list = _audits.Values
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToList();
        return Task.FromResult<IReadOnlyList<AuditDocument>>(list.AsReadOnly());
    }

    public Task<ChatMessageDocument> SaveMessageAsync(ChatMessageDocument message, CancellationToken ct = default)
    {
        var list = _messagesByAudit.GetOrAdd(message.AuditId, _ => []);
        lock (list)
        {
            list.Add(message);
        }
        return Task.FromResult(message);
    }

    public Task<IReadOnlyList<ChatMessageDocument>> GetMessagesForAuditAsync(string auditId, CancellationToken ct = default)
    {
        if (_messagesByAudit.TryGetValue(auditId, out var list))
        {
            lock (list)
            {
                return Task.FromResult<IReadOnlyList<ChatMessageDocument>>(list.OrderBy(m => m.Timestamp).ToList().AsReadOnly());
            }
        }

        return Task.FromResult<IReadOnlyList<ChatMessageDocument>>([]);
    }
}
