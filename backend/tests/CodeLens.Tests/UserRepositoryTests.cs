namespace CodeLens.Tests;

using CodeLens.Core.Entities;
using CodeLens.Infrastructure.Data;
using Xunit;

public class UserRepositoryTests
{
    [Fact]
    public async Task DeleteAllUsersAsync_ClearsAllUsersFromRepository()
    {
        var repo = new InMemoryCosmosRepository();

        await repo.UpsertUserAsync(new UserDocument
        {
            Id = "usr_1",
            Email = "user1@example.com",
            Name = "User 1"
        });

        await repo.UpsertUserAsync(new UserDocument
        {
            Id = "usr_2",
            Email = "user2@example.com",
            Name = "User 2"
        });

        Assert.NotNull(await repo.GetUserByEmailAsync("user1@example.com"));
        Assert.NotNull(await repo.GetUserByIdAsync("usr_2"));

        var deletedCount = await repo.DeleteAllUsersAsync();

        Assert.Equal(2, deletedCount);
        Assert.Null(await repo.GetUserByEmailAsync("user1@example.com"));
        Assert.Null(await repo.GetUserByIdAsync("usr_2"));
    }

    [Fact]
    public async Task GetLatestAuditByRepoAsync_ReturnsMostRecentCompletedAuditForRepo()
    {
        var repo = new InMemoryCosmosRepository();

        var olderAudit = new AuditDocument
        {
            Id = "audit_old",
            RepositoryId = "owner_repo",
            RepoUrl = "https://github.com/owner/repo",
            UserId = "user1",
            Status = AuditStatus.Completed,
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
        };

        var newerAudit = new AuditDocument
        {
            Id = "audit_new",
            RepositoryId = "owner_repo",
            RepoUrl = "https://github.com/owner/repo",
            UserId = "user2",
            Status = AuditStatus.Completed,
            CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-10)
        };

        var differentRepoAudit = new AuditDocument
        {
            Id = "audit_diff",
            RepositoryId = "other_repo",
            RepoUrl = "https://github.com/other/repo",
            UserId = "user1",
            Status = AuditStatus.Completed,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await repo.UpsertAuditAsync(olderAudit);
        await repo.UpsertAuditAsync(newerAudit);
        await repo.UpsertAuditAsync(differentRepoAudit);

        var latest = await repo.GetLatestAuditByRepoAsync("owner_repo");

        Assert.NotNull(latest);
        Assert.Equal("audit_new", latest.Id);
    }
}
