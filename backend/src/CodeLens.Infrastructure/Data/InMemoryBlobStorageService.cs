using CodeLens.Core.Interfaces;
using System.Collections.Concurrent;

namespace CodeLens.Infrastructure.Data;

/// <summary>
/// In-memory mock for local development when Azure Blob Storage connection string is not provided.
/// </summary>
public sealed class InMemoryBlobStorageService : IBlobStorageService
{
    private readonly ConcurrentDictionary<string, string> _blobs = new();

    public Task<string> UploadDossierAsync(string repositoryId, string markdownContent, CancellationToken ct = default)
    {
        var blobName = $"{repositoryId}/PROJECT_KNOWLEDGE.md";
        _blobs[blobName] = markdownContent;
        return Task.FromResult(blobName);
    }

    public Task<(string Url, DateTimeOffset ExpiresAt)> GenerateSasUrlAsync(string blobName, CancellationToken ct = default)
    {
        // Mock local download URL for development testing
        var url = $"http://localhost:5000/api/audits/mock-blob/{Uri.EscapeDataString(blobName)}";
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15);
        return Task.FromResult((url, expiresAt));
    }
}
