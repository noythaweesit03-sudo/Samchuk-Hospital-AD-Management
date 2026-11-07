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
    public void LdapFilterSanitizer_BuildUserSearchFilter_ConstructsSafeQueryWithLockoutPolicyWindow()
    {
        var query = new UserFilterQuery
        {
            Search = "kittisak*(admin)",
            Department = "Medical",
            Status = "LockedOut"
        };

        var referenceUtc = new DateTime(2026, 11, 1, 12, 0, 0, DateTimeKind.Utc);
        var filter = LdapFilterSanitizer.BuildUserSearchFilter(query, lockoutDurationMinutes: 30, referenceUtc: referenceUtc);

        var expectedMinLockoutFileTime = referenceUtc.AddMinutes(-30).ToFileTimeUtc();

        Assert.Contains("(objectCategory=person)(objectClass=user)(!(objectClass=computer))", filter);
        Assert.Contains("kittisak\\2a\\28admin\\29", filter);
        Assert.Contains("(department=*Medical*)", filter);
        Assert.Contains($"(lockoutTime>={expectedMinLockoutFileTime})", filter);
    }

    [Fact]
    public void LdapFilterSanitizer_DistinguishedNameValidation_SupportsEscapedCommasAndSearchBaseScope()
    {
        Assert.False(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("", out _));
        Assert.False(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example", out _));
        Assert.False(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("INVALID_DN_STRING", out _));
        Assert.True(LdapFilterSanitizer.IsStructurallyValidDistinguishedName("OU=HospitalStaff,DC=example,DC=org", out _));

        // RFC 4514 escaped comma (\, and \2C) inside an OU or CN name must be accepted
        var dnWithEscapedComma = @"CN=Somchai\, MD,OU=Medicine\, Internal,OU=HospitalStaff,DC=example,DC=org";
        Assert.True(LdapFilterSanitizer.IsStructurallyValidDistinguishedName(dnWithEscapedComma, out var reason), reason);

        var dnWithHexEscapedComma = @"OU=Ward\2C Emergency,OU=HospitalStaff,DC=example,DC=org";
        Assert.True(LdapFilterSanitizer.IsStructurallyValidDistinguishedName(dnWithHexEscapedComma, out var hexReason), hexReason);

        // Search base scope validation
        var searchBase = "OU=HospitalStaff,DC=example,DC=org";
        Assert.True(LdapFilterSanitizer.IsDnScopedWithinSearchBase(dnWithEscapedComma, searchBase));
        Assert.False(LdapFilterSanitizer.IsDnScopedWithinSearchBase("CN=ExternalUser,OU=OtherOrg,DC=example,DC=org", searchBase));
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
    public void ActiveDirectoryOptions_ClampsTimeoutPageSizeAndWindow_AndRedactsPassword()
    {
        var options = new ActiveDirectoryOptions
        {
            ConnectionTimeoutSeconds = 999,
            LdapPageSize = 5000,
            MaxResultWindowLimit = 99999,
            LockoutDurationMinutes = 30,
            ReadOnlyServicePassword = "SuperSecretValue123!"
        };

        Assert.Equal(60, options.GetEffectiveTimeoutSeconds());
        Assert.Equal(500, options.GetEffectivePageSize());
        Assert.Equal(2000, options.GetEffectiveMaxResultWindowLimit());
        Assert.Equal(30, options.GetEffectiveLockoutDurationMinutes());

        var redacted = options.ToRedactedSummary();
        Assert.Equal("[REDACTED_NEVER_LOGGED]", redacted.ServicePasswordStatus);
        Assert.DoesNotContain("SuperSecretValue123!", redacted.ServicePasswordStatus);
    }

    [Fact]
    public void LdapsReadService_EvaluatesLockoutPolicyAccurately_DoesNotRelyOnLockoutTimeGreaterThanZeroAlone()
    {
        var referenceUtc = new DateTime(2026, 11, 1, 12, 0, 0, DateTimeKind.Utc);

        // Normal enabled account (512)
        Assert.Equal("Enabled", LdapsReadService.ParseAccountStatus(512, 0, lockoutDurationMinutes: 30, referenceUtc: referenceUtc));
        // Disabled account (514 = 512 + 2)
        Assert.Equal("Disabled", LdapsReadService.ParseAccountStatus(514, 0, lockoutDurationMinutes: 30, referenceUtc: referenceUtc));

        // Active lockout: locked out 10 minutes ago (within 30-minute lockout duration window)
        var recentLockoutFileTime = referenceUtc.AddMinutes(-10).ToFileTimeUtc();
        Assert.Equal("LockedOut", LdapsReadService.ParseAccountStatus(512, recentLockoutFileTime, lockoutDurationMinutes: 30, referenceUtc: referenceUtc));

        // Expired lockout: locked out 45 minutes ago (AD leaves lockoutTime > 0 until next login, but policy duration has elapsed)
        var expiredLockoutFileTime = referenceUtc.AddMinutes(-45).ToFileTimeUtc();
        Assert.Equal("Enabled", LdapsReadService.ParseAccountStatus(512, expiredLockoutFileTime, lockoutDurationMinutes: 30, referenceUtc: referenceUtc));

        // Authoritative computed attribute (msDS-User-Account-Control-Computed): UF_LOCKOUT (0x0010 = 16)
        Assert.Equal("LockedOut", LdapsReadService.ParseAccountStatus(512, expiredLockoutFileTime, lockoutDurationMinutes: 30, computedUac: 16, referenceUtc: referenceUtc));
        Assert.Equal("Enabled", LdapsReadService.ParseAccountStatus(512, recentLockoutFileTime, lockoutDurationMinutes: 30, computedUac: 0, referenceUtc: referenceUtc));

        // UAC Flags reflect active vs expired lockout
        var activeFlags = LdapsReadService.ParseUacFlags(512, recentLockoutFileTime, lockoutDurationMinutes: 30, referenceUtc: referenceUtc);
        Assert.Contains("LOCKOUT", activeFlags);

        var expiredFlags = LdapsReadService.ParseUacFlags(512, expiredLockoutFileTime, lockoutDurationMinutes: 30, referenceUtc: referenceUtc);
        Assert.DoesNotContain("LOCKOUT", expiredFlags);

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
    public void LdapsReadService_BoundedPagingPlan_EnforcesResultWindowAndPreventsUnboundedLoads()
    {
        var plan = LdapsReadService.CalculateBoundedPagingPlan(
            requestedPageNumber: 2,
            requestedPageSize: 25,
            configuredLdapPageSize: 100,
            maxResultWindowLimit: 500);

        Assert.Equal(2, plan.RequestedPageNumber);
        Assert.Equal(25, plan.RequestedPageSize);
        Assert.Equal(25, plan.SkipCount);
        Assert.Equal(50, plan.TargetFetchCount);
        Assert.Equal(500, plan.MaxEntriesToFetch);
        Assert.Equal(50, plan.EffectiveLdapControlPageSize);

        // Requesting a page beyond the safety window throws ArgumentOutOfRangeException
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            LdapsReadService.CalculateBoundedPagingPlan(
                requestedPageNumber: 50,
                requestedPageSize: 25,
                configuredLdapPageSize: 100,
                maxResultWindowLimit: 500));
    }

    [Fact]
    public void LdapsReadService_ParsesWhenCreatedGeneralizedTime_AndObjectGuidStableIdentifier()
    {
        // ASN.1 GeneralizedTime from Active Directory whenCreated attribute
        var parsedWhenCreated = LdapsReadService.ParseAdWhenCreatedToUtc("20240310020000.0Z");
        Assert.NotNull(parsedWhenCreated);
        Assert.Equal(new DateTime(2024, 3, 10, 2, 0, 0, DateTimeKind.Utc), parsedWhenCreated.Value);

        // Missing or invalid whenCreated returns DateTime.MinValue sentinel (never DateTime.UtcNow)
        Assert.Null(LdapsReadService.ParseAdWhenCreatedToUtc(null));
        Assert.Null(LdapsReadService.ParseAdWhenCreatedToUtc("INVALID_DATE"));

        // objectGUID binary-to-GUID conversion and RFC 4515 octet filter
        var expectedGuid = Guid.Parse("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d");
        var guidBytes = expectedGuid.ToByteArray();
        var convertedId = LdapsReadService.ConvertObjectGuidBytesToString(guidBytes, "fallback");
        Assert.Equal("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", convertedId);

        var idOrAccountFilter = LdapFilterSanitizer.BuildIdentifierOrAccountFilter(
            "(objectClass=user)",
            "sAMAccountName",
            "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d");
        Assert.Contains("objectGUID=\\d4\\c3\\b2\\a1", idOrAccountFilter);
        Assert.Contains("(sAMAccountName=a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d)", idOrAccountFilter);
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
    public void AuthorizationPolicies_AndDiagnosticsController_EnforceIdenticalRbacRoles()
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

        // DiagnosticsController defense-in-depth helper must match ADOperatorOrAbove
        Assert.False(SamchukHospital.AdManagement.Api.Controllers.DiagnosticsController.IsRolePermittedForDiagnostics("Viewer"));
        Assert.False(SamchukHospital.AdManagement.Api.Controllers.DiagnosticsController.IsRolePermittedForDiagnostics("Helpdesk"));
        Assert.True(SamchukHospital.AdManagement.Api.Controllers.DiagnosticsController.IsRolePermittedForDiagnostics("ADOperator"));
        Assert.True(SamchukHospital.AdManagement.Api.Controllers.DiagnosticsController.IsRolePermittedForDiagnostics("SecurityAuditor"));
        Assert.True(SamchukHospital.AdManagement.Api.Controllers.DiagnosticsController.IsRolePermittedForDiagnostics("SystemAdministrator"));

        var auditorRoles = SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.GetAllowedRolesForPolicy(
            SamchukHospital.AdManagement.Api.Security.AuthorizationPolicies.SecurityAuditorOrAbove);
        Assert.Equal(2, auditorRoles.Count);
        Assert.Contains("SecurityAuditor", auditorRoles);
        Assert.Contains("SystemAdministrator", auditorRoles);
    }
}
