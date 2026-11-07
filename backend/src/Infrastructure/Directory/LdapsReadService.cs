using System.DirectoryServices.Protocols;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// Production LDAPS Read Service implementation for Windows Server 2025 AD DS.
/// BOUNDARY: STRICTLY DISABLED IN PHASE 1 (_isLiveAdEnabled = false).
/// Prepared for Phase 2 with mandatory TLS 1.2/1.3, X.509 Certificate Chain validation,
/// and strict Subject Alternative Name (SAN) / Hostname matching.
/// Never bypasses or disables TLS verification.
/// </summary>
public class LdapsReadService : IDirectoryReadService
{
    private const bool IsLiveAdEnabled = false; // Phase 1 Security Gate: Hard-disabled constant

    public bool IsLiveConnectionEnabled => IsLiveAdEnabled;

    public LdapsReadService()
    {
        // Guaranteed no network socket or LDAP bind in Phase 1
    }

    /// <summary>
    /// Validates the Domain Controller LDAPS server certificate for Phase 2 readiness.
    /// Enforces:
    /// 1. Non-null certificate and non-empty target hostname.
    /// 2. Certificate validity period (NotBefore / NotAfter).
    /// 3. Strict SAN (Subject Alternative Name) / DNS hostname match via X509Certificate2.MatchesHostname
    ///    (wildcards disabled to require exact DC FQDN match).
    /// 4. Full X.509 Chain build and revocation verification with zero bypass flags.
    /// </summary>
    public static bool ValidateServerCertificate(string expectedServerHostname, X509Certificate? certificate)
    {
        if (string.IsNullOrWhiteSpace(expectedServerHostname) || certificate == null)
        {
            return false;
        }

        using var x509 = new X509Certificate2(certificate);

        // 1. Verify certificate validity window in UTC
        var nowUtc = DateTime.UtcNow;
        if (nowUtc < x509.NotBefore.ToUniversalTime() || nowUtc > x509.NotAfter.ToUniversalTime())
        {
            return false;
        }

        // 2. Strict SAN / Hostname verification (.NET 8 X509Certificate2.MatchesHostname)
        // Disallows wildcards so the certificate must explicitly match the target DC hostname in SAN or CN.
        var hostMatches = x509.MatchesHostname(
            expectedServerHostname.Trim(),
            allowWildcards: false,
            allowCommonName: true);

        if (!hostMatches)
        {
            return false;
        }

        // 3. Strict X.509 Certificate Chain & Revocation verification (no bypass flags allowed)
        using var chain = new X509Chain();
        chain.ChainPolicy.RevocationMode = X509RevocationMode.Online;
        chain.ChainPolicy.RevocationFlag = X509RevocationFlag.ExcludeRoot;
        chain.ChainPolicy.VerificationFlags = X509VerificationFlags.NoFlag;
        chain.ChainPolicy.VerificationTime = nowUtc;

        var isChainValid = chain.Build(x509);
        if (!isChainValid)
        {
            return false;
        }

        foreach (var status in chain.ChainStatus)
        {
            if (status.Status != X509ChainStatusFlags.NoError)
            {
                return false;
            }
        }

        return true;
    }

    private LdapConnection CreateSecureConnection(string serverAddress, int port, string serviceUsername, string servicePassword)
    {
        if (!IsLiveAdEnabled)
        {
            throw new InvalidOperationException("Live AD LDAPS connection is strictly disabled in Phase 1. Refer to docs/AD_INTEGRATION_PLAN.md.");
        }

        var identifier = new LdapDirectoryIdentifier(serverAddress, port);
        var credentials = new NetworkCredential(serviceUsername, servicePassword);

        var connection = new LdapConnection(identifier, credentials, AuthType.Negotiate);
        connection.SessionOptions.SecureSocketLayer = true;
        connection.SessionOptions.ProtocolVersion = 3;

        // Strict TLS Certificate validation - Never accept untrusted or mismatched certificates
        connection.SessionOptions.VerifyServerCertificate = (_, cert) =>
            ValidateServerCertificate(serverAddress, cert);

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
