using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Infrastructure.Directory;
using Xunit;

namespace SamchukHospital.AdManagement.Tests;

public class UserFilterTests
{
    private readonly IDirectoryReadService _directoryReadService;

    public UserFilterTests()
    {
        _directoryReadService = new LdapReadServiceMock();
    }

    [Fact]
    public async Task GetUsersAsync_WithEmptyFilter_ReturnsPagedResults()
    {
        var query = new UserFilterQuery { PageNumber = 1, PageSize = 10 };
        var result = await _directoryReadService.GetUsersAsync(query);

        Assert.NotNull(result);
        Assert.NotEmpty(result.Items);
        Assert.True(result.TotalCount > 0);
    }

    [Fact]
    public async Task GetUsersAsync_FilterByLockedOut_ReturnsOnlyLockedUsers()
    {
        var query = new UserFilterQuery { Status = "LockedOut", PageNumber = 1, PageSize = 10 };
        var result = await _directoryReadService.GetUsersAsync(query);

        Assert.NotNull(result);
        Assert.All(result.Items, u => Assert.Equal("LockedOut", u.Status));
    }

    [Fact]
    public async Task GetUserByIdAsync_WithValidId_ReturnsExpectedUser()
    {
        var user = await _directoryReadService.GetUserByIdAsync("usr-001");

        Assert.NotNull(user);
        Assert.Equal("kittisak.pra", user.SamAccountName);
    }

    [Fact]
    public async Task GetUserByIdAsync_WithInvalidId_ReturnsNull()
    {
        var user = await _directoryReadService.GetUserByIdAsync("non-existent-user");

        Assert.Null(user);
    }
}
