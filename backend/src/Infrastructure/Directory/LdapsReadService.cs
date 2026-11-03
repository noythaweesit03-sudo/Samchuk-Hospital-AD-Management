using System.DirectoryServices.Protocols;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// Production LDAPS Read Service implementation for Windows Server 2025 AD DS.
/// BOUNDARY: STRICTLY DISABLED IN PHASE 1.
/// Activates only in Phase 2 after verifying Application Server host, DNS resolution, and CA chain.
/// Uses System.DirectoryServices.Protocols with LDAPS (TCP 636) and strict TLS verification.
/// </summary>
public class LdapsReadService : IDirectoryReadService
{
    private readonly bool _isLiveAdEnabled = false; // Phase 1 Security Gate: Hard-disabled

    public LdapsReadService()
    {
        // Enforce safety check
        if (!_isLiveAdEnabled)
        {
            // Guaranteed no network socket or LDAP bind
        }
    }

    private LdapConnection CreateSecureConnection(string serverAddress, int port, string serviceUsername, string servicePassword)
    {
        if (!_isLiveAdEnabled)
        {
            throw new InvalidOperationException("Live AD LDAPS connection is disabled in Phase 1. Refer to docs/AD_INTEGRATION_PLAN.md.");
        }

        var identifier = new LdapDirectoryIdentifier(serverAddress, port, fullyQualifiedDnsHostName: true, connectionIsBound: false);
        var credentials = new NetworkCredential(serviceUsername, servicePassword);

        var connection = new LdapConnection(identifier, credentials, AuthType.Negotiate);
        connection.SessionOptions.SecureSocketLayer = true;
        connection.SessionOptions.ProtocolVersion = 3;

        // Strict TLS Certificate validation - Never accept untrusted or invalid certificates!
        connection.SessionOptions.VerifyServerCertificate = (conn, cert) =>
        {
            if (cert == null) return false;
            var x509 = new X509Certificate2(cert);
            using var chain = new X509Chain();
            chain.ChainPolicy.RevocationMode = X509RevocationMode.Online;
            chain.ChainPolicy.RevocationFlag = X509RevocationFlag.ExcludeRoot;
            return chain.Build(x509);
        };

        return connection;
    }

    public Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<PagedResult<AdUser>> GetUsersAsync(UserFilterQuery query, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<AdUser?> GetUserByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<PagedResult<AdComputer>> GetComputersAsync(ComputerFilterQuery query, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<AdComputer?> GetComputerByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<List<AdOrganizationalUnit>> GetOuTreeAsync(CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<AdOrganizationalUnit?> GetOuByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<List<AdGroup>> GetGroupsAsync(GroupFilterQuery query, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }

    public Task<AdGroup?> GetGroupByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Live AD query is disabled in Phase 1.");
    }
}
