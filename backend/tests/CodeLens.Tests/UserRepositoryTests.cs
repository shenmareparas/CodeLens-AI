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
}
