using CodeLens.Core.Entities;

namespace CodeLens.Core.Interfaces;

/// <summary>Cosmos DB repository abstraction for all three containers.</summary>
public interface ICosmosRepository
{
    // Users
    Task<UserDocument?> GetUserByEmailAsync(string email, CancellationToken ct = default);
    Task<UserDocument?> GetUserByIdAsync(string id, CancellationToken ct = default);
    Task<UserDocument> UpsertUserAsync(UserDocument user, CancellationToken ct = default);
    Task<int> DeleteAllUsersAsync(CancellationToken ct = default);

    // Audits
    Task<AuditDocument?> GetAuditAsync(string auditId, string? repositoryId = null, CancellationToken ct = default);
    Task<AuditDocument?> GetLatestAuditByRepoAsync(string repositoryId, CancellationToken ct = default);
    Task<AuditDocument> UpsertAuditAsync(AuditDocument audit, CancellationToken ct = default);
    Task<IReadOnlyList<AuditDocument>> GetAuditsByUserAsync(string userId, CancellationToken ct = default);

    // Chat
    Task<ChatMessageDocument> SaveMessageAsync(ChatMessageDocument message, CancellationToken ct = default);
    Task<IReadOnlyList<ChatMessageDocument>> GetMessagesForAuditAsync(string auditId, CancellationToken ct = default);
}
