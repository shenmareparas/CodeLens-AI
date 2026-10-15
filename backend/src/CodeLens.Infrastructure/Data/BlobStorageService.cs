using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using CodeLens.Core.Interfaces;
using Microsoft.Extensions.Options;

namespace CodeLens.Infrastructure.Data;

public sealed class BlobStorageOptions
{
    public string ConnectionString { get; set; } = default!;
    public string ContainerName { get; set; } = "project-dossiers";
}

public sealed class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _container;

    public BlobStorageService(IOptions<BlobStorageOptions> options)
    {
        _container = new BlobContainerClient(
            options.Value.ConnectionString,
            options.Value.ContainerName);
    }

    public async Task<string> UploadDossierAsync(
        string repositoryId,
        string markdownContent,
        CancellationToken ct = default)
    {
        // Ensure container exists (idempotent)
        await _container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: ct);

        var blobName = $"{repositoryId}/PROJECT_KNOWLEDGE.md";
        var blobClient = _container.GetBlobClient(blobName);

        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(markdownContent));
        await blobClient.UploadAsync(stream, overwrite: true, cancellationToken: ct);

        return blobName;
    }

    public Task<(string Url, DateTimeOffset ExpiresAt)> GenerateSasUrlAsync(
        string blobName,
        CancellationToken ct = default)
    {
        var blobClient = _container.GetBlobClient(blobName);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15);

        var sasUri = blobClient.GenerateSasUri(BlobSasPermissions.Read, expiresAt);
        return Task.FromResult((sasUri.ToString(), expiresAt));
    }
}
