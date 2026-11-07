using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Infrastructure.Directory;
using Xunit;

namespace SamchukHospital.AdManagement.Tests;

public class Phase2AReadinessTests
{
    [Fact]
    public void LdapFilterSanitizer_EscapesRfc4515SpecialCharacters_PreventsLdapInjection()
    {
        var maliciousInput = "admin*)(|(userPassword=*))\\test\0";
        var escaped = LdapFilterSanitizer.EscapeFilterValue(maliciousInput);

        Assert.DoesNotContain("*", escaped);
        Assert.DoesNotContain("(", escaped);
        Assert.DoesNotContain(")", escaped);
        Assert.Contains("\\2a", escaped);
        Assert.Contains("\\28", escaped);
        Assert.Contains("\\29", escaped);
        Assert.Contains("\\5c", escaped);
        Assert.Contains("\\00", escaped);
    }

    [Fact]
    public void LdapFilterSanitizer_InputExceedingMaxLength_ThrowsArgumentException()
    {
        var oversizedInput = new string('a', LdapFilterSanitizer.MaxSearchInputLength + 1);
        Assert.Throws<ArgumentException>(() => LdapFilterSanitizer.EscapeFilterValue(oversizedInput));
    }

    [Fact]
    public void LdapFilterSanitizer_BuildUserSearchFilter_ConstructsSafeQuery()
    {
        var query = new UserFilterQuery
        {
            Search = "kittisak*(admin)",
            Department = "Medical",
            Status = "LockedOut"
        };

        var filter = LdapFilterSanitizer.BuildUserSearchFilter(query);

        Assert.Contains("(objectCategory=person)(objectClass=user)(!(objectClass=computer))", filter);
        Assert.Contains("kittisak\\2a\\28admin\\29", filter);
        Assert.Contains("(department=*Medical*)", filter);
        Assert.Contains("(lockoutTime>=1)", filter);
    }

    [Fact]
    public void LdapFilterSanitizer_DistinguishedNameValidation_RejectsPlaceholdersAndInvalidSyntax()
    {
        Assert.False(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("", out _));
        Assert.False(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example", out _));
        Assert.False(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("INVALID_DN_STRING", out _));
        Assert.True(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("OU=HospitalStaff,DC=example,DC=org", out _));
    }

    [Fact]
    public void ActiveDirectoryOptions_FeatureFlagDefaultsToFalse_AndCannotBypassPhase2ACodeGate()
    {
        var defaultOptions = new ActiveDirectoryOptions();
        Assert.False(defaultOptions.EnableLiveReadOnlyConnection);
        Assert.True(ActiveDirectoryOptions.IsPhase2ACodeGateLocked);
        Assert.False(defaultOptions.IsEffectiveLiveConnectionAllowed);

        // Even if someone sets EnableLiveReadOnlyConnection = true in config, Phase 2A code gate blocks it
        var overriddenOptions = new ActiveDirectoryOptions
        {
            EnableLiveReadOnlyConnection = true,
            DomainControllerFqdn = "dc01.example.org",
            SearchBase = "OU=Staff,DC=example,DC=org",
            ReadOnlyServiceAccount = "svc_ro"
        };

        Assert.False(overriddenOptions.IsEffectiveLiveConnectionAllowed);
    }

    [Fact]
    public async Task LdapsReadService_EvenWhenConfigFlagIsTrue_EnforcesPhase2AHardLock()
    {
        var options = new ActiveDirectoryOptions
        {
            EnableLiveReadOnlyConnection = true,
            DomainControllerFqdn = "dc01.example.org",
            SearchBase = "OU=Staff,DC=example,DC=org",
            ReadOnlyServiceAccount = "svc_ro"
        };

        var service = new LdapsReadService(options);
        Assert.False(service.IsLiveConnectionEnabled);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GetUsersAsync(new UserFilterQuery()));
        Assert.Contains("PHASE_2A_HARD_LOCK", ex.Message);
    }

    [Fact]
    public async Task LdapsReadService_RespectsCancellationToken()
    {
        var service = new LdapsReadService();
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            service.GetUsersAsync(new UserFilterQuery(), cts.Token));
    }

    [Fact]
    public void ActiveDirectoryOptions_ClampsTimeoutAndPageSize_AndRedactsPassword()
    {
        var options = new ActiveDirectoryOptions
        {
            ConnectionTimeoutSeconds = 999,
            LdapPageSize = 5000,
            ReadOnlyServicePassword = "SuperSecretValue123!"
        };

        Assert.Equal(60, options.GetEffectiveTimeoutSeconds());
        Assert.Equal(500, options.GetEffectivePageSize());

        var redacted = options.ToRedactedSummary();
        Assert.Equal("[REDACTED_NEVER_LOGGED]", redacted.ServicePasswordStatus);
        Assert.DoesNotContain("SuperSecretValue123!", redacted.ServicePasswordStatus);
    }

    [Fact]
    public void LdapsReadService_DecodesAccountStatusAndFileTimeAccurately()
    {
        // Normal enabled account (512)
        Assert.Equal("Enabled", LdapsReadService.ParseAccountStatus(512, 0));
        // Disabled account (514 = 512 + 2)
        Assert.Equal("Disabled", LdapsReadService.ParseAccountStatus(514, 0));
        // Locked out account via lockoutTime > 0
        Assert.Equal("LockedOut", LdapsReadService.ParseAccountStatus(512, 133750000000000000));

        // FileTime conversion
        Assert.Null(LdapsReadService.ConvertAdFileTimeToUtc(null));
        Assert.Null(LdapsReadService.ConvertAdFileTimeToUtc("0"));
        Assert.Null(LdapsReadService.ConvertAdFileTimeToUtc("9223372036854775807"));

        var expectedDate = new DateTime(2026, 10, 15, 8, 30, 0, DateTimeKind.Utc);
        var fileTimeStr = expectedDate.ToFileTimeUtc().ToString();
        var converted = LdapsReadService.ConvertAdFileTimeToUtc(fileTimeStr);
        Assert.NotNull(converted);
        Assert.Equal(expectedDate, converted.Value);

        // Accuracy limitation note must be documented
        Assert.Contains("9–14 day", LdapsReadService.LastLogonAccuracyLimitationNote);
    }

    [Fact]
    public async Task LdapsDiagnosticsService_ReturnsSixChecks_AllSimulatedOrNotTested_NeverFakesSuccess()
    {
        var diagnosticsService = new LdapsDiagnosticsService(new ActiveDirectoryOptions());
        var report = await diagnosticsService.GetConnectionReadinessAsync();

        Assert.False(report.IsLiveAdConnectionActive);
        Assert.True(report.IsPhase2ACodeGateLocked);
        Assert.Equal(6, report.Checks.Count);
        Assert.Equal("[REDACTED_NEVER_LOGGED]", report.Configuration.ServicePasswordStatus);

        var allowedStatuses = new[] { "Simulated", "NotTested", "NotConfigured" };
        Assert.All(report.Checks, check =>
        {
            Assert.False(check.IsLiveTested);
            Assert.Contains(check.Status, allowedStatuses);
            Assert.NotEqual("Passed", check.Status);
            Assert.NotEqual("Connected", check.Status);
        });
    }

    [Fact]
    public void DemoAuthenticationHandler_RejectsProductionAndStaging_AllowsOnlyDevAndTest()
    {
        Assert.False(SamchukHospital.AdManagement.Api.Security.DemoAuthenticationHandler.IsEnvironmentPermittedForDemoAuth("Production"));
        Assert.False(SamchukHospital.AdManagement.Api.Security.DemoAuthenticationHandler.IsEnvironmentPermittedForDemoAuth("Staging"));
        Assert.False(SamchukHospital.AdManagement.Api.Security.DemoAuthenticationHandler.IsEnvironmentPermittedForDemoAuth("UAT"));
        Assert.False(SamchukHospital.AdManagement.Api.Security.DemoAuthenticationHandler.IsEnvironmentPermittedForDemoAuth(null));

        Assert.True(SamchukHospital.AdManagement.Api.Security.DemoAuthenticationHandler.IsEnvironmentPermittedForDemoAuth("Development"));
        Assert.True(SamchukHospital.AdManagement.Api.Security.DemoAuthenticationHandler.IsEnvironmentPermittedForDemoAuth("Test"));
    }

    [Fact]
    public void AuthorizationPolicies_EnforcesFiveRoleHierarchyCorrectly()
    {
        var viewerRoles = SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.GetAllowedRolesForPolicy(
            SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.ViewerOrAbove);
        Assert.Equal(5, viewerRoles.Count);

        var operatorRoles = SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.GetAllowedRolesForPolicy(
            SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.ADOperatorOrAbove);
        Assert.DoesNotContain("Viewer", operatorRoles);
        Assert.DoesNotContain("Helpdesk", operatorRoles);
        Assert.Contains("ADOperator", operatorRoles);
        Assert.Contains("SecurityAuditor", operatorRoles);
        Assert.Contains("SystemAdministrator", operatorRoles);

        var auditorRoles = SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.GetAllowedRolesForPolicy(
            SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.SecurityAuditorOrAbove);
        Assert.Equal(2, auditorRoles.Count);
        Assert.Contains("SecurityAuditor", auditorRoles);
        Assert.Contains("SystemAdministrator", auditorRoles);
    }
}
