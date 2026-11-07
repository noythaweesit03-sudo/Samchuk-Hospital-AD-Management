using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
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
    public async Task GetUsersAsync_SortBySamAccountNameDesc_OrdersCorrectly()
    {
        var query = new UserFilterQuery
        {
            PageNumber = 1,
            PageSize = 10,
            SortBy = "sAMAccountName",
            SortOrder = "desc"
        };
        var result = await _directoryReadService.GetUsersAsync(query);

        Assert.NotNull(result);
        Assert.True(result.Items.Count >= 2);
        Assert.Equal("wuttichai.sam", result.Items[0].SamAccountName);
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

    [Fact]
    public async Task LdapsReadService_InPhase1_IsStrictlyDisabledAndThrowsNotSupported()
    {
        var ldapsService = new LdapsReadService();

        Assert.False(ldapsService.IsLiveConnectionEnabled);
        await Assert.ThrowsAsync<NotSupportedException>(() => ldapsService.GetDashboardSummaryAsync());
        await Assert.ThrowsAsync<NotSupportedException>(() => ldapsService.GetUsersAsync(new UserFilterQuery()));
    }

    [Fact]
    public void LdapsReadService_ValidateServerCertificate_RejectsNullOrMismatchedHostnameOrUntrustedSelfSigned()
    {
        // 1. Rejects null certificate or empty hostname
        Assert.False(LdapsReadService.ValidateServerCertificate("dc.placeholder.example", null));
        Assert.False(LdapsReadService.ValidateServerCertificate("", null));

        // 2. Generate ephemeral self-signed certificate with SAN 'dc.placeholder.example'
        using var rsa = RSA.Create(2048);
        var req = new CertificateRequest("CN=dc.placeholder.example", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        var sanBuilder = new SubjectAlternativeNameBuilder();
        sanBuilder.AddDnsName("dc.placeholder.example");
        req.CertificateExtensions.Add(sanBuilder.Build());

        using var selfSignedCert = req.CreateSelfSigned(DateTimeOffset.UtcNow.AddMinutes(-5), DateTimeOffset.UtcNow.AddDays(1));

        // Mismatched hostname is strictly rejected before chain build
        Assert.False(LdapsReadService.ValidateServerCertificate("wrong-host.placeholder.example", selfSignedCert));

        // Untrusted self-signed certificate is strictly rejected by X509Chain validation
        Assert.False(LdapsReadService.ValidateServerCertificate("dc.placeholder.example", selfSignedCert));
    }
}
