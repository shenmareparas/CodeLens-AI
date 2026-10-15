using CodeLens.Core.Entities;

namespace CodeLens.Core.Interfaces;

/// <summary>Azure Blob Storage abstraction for dossier upload/download.</summary>
public interface IBlobStorageService
{
    /// <summary>Uploads the dossier Markdown and returns the blob name.</summary>
    Task<string> UploadDossierAsync(string repositoryId, string markdownContent, CancellationToken ct = default);

    /// <summary>Generates a 15-minute read-only SAS URL for the given blob.</summary>
    Task<(string Url, DateTimeOffset ExpiresAt)> GenerateSasUrlAsync(string blobName, CancellationToken ct = default);
}
