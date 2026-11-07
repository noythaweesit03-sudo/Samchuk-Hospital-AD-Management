using System.Text.RegularExpressions;

namespace SamchukHospital.AdManagement.Infrastructure.Audit;

/// <summary>
/// Samchuk Hospital AD Management - Permanent Audit Logging Architecture & Design
/// 
/// Compliance:
/// - Hospital Accreditation (HA) Information Security Standards
/// - Personal Data Protection Act (PDPA) Thailand
/// - Windows Server 2025 AD Security Auditing Guidelines
/// 
/// Requirements:
/// 1. Correlation ID, TimestampUtc, ActorUsername, ActorRole, ClientIp, Action, Target, Result.
/// 2. Immutable / Write-Once Audit Store (SQL Server / PostgreSQL).
/// 3. Zero sensitive data (passwords, hashes, cleartext credentials) in logged payloads.
/// </summary>
public static class PermanentAuditRepositoryDesign
{
    /// <summary>
    /// Microsoft SQL Server Table DDL Script for Permanent Audit Logs
    /// </summary>
    public const string SqlServerDdlScript = @"
-- =========================================================================
-- SAMCHUK HOSPITAL ACTIVE DIRECTORY MANAGEMENT SYSTEM
-- Permanent Audit Logs DDL (SQL Server 2019 / 2022)
-- =========================================================================

CREATE TABLE [dbo].[AdAuditLogs] (
    [Id] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AdAuditLogs] PRIMARY KEY CLUSTERED,
    [CorrelationId] NVARCHAR(64) NOT NULL,
    [TimestampUtc] DATETIME2(7) NOT NULL CONSTRAINT [DF_AdAuditLogs_TimestampUtc] DEFAULT (SYSUTCDATETIME()),
    [ActorUsername] NVARCHAR(128) NOT NULL,
    [ActorRole] NVARCHAR(64) NOT NULL,
    [ClientIp] VARCHAR(45) NOT NULL,
    [UserAgent] NVARCHAR(256) NULL,
    [Action] NVARCHAR(64) NOT NULL,
    [TargetObject] NVARCHAR(256) NOT NULL,
    [TargetType] NVARCHAR(64) NOT NULL,
    [Result] NVARCHAR(32) NOT NULL, -- Success, Failed, Denied
    [Reason] NVARCHAR(512) NULL,
    [SanitizedDetailsJson] NVARCHAR(MAX) NULL,
    
    -- Immutability Guard: Row cannot be modified after insertion
    [CreatedUtc] DATETIME2(7) NOT NULL CONSTRAINT [DF_AdAuditLogs_CreatedUtc] DEFAULT (SYSUTCDATETIME())
);

-- Indices for rapid querying and security audits
CREATE NONCLUSTERED INDEX [IX_AdAuditLogs_CorrelationId] ON [dbo].[AdAuditLogs] ([CorrelationId]);
CREATE NONCLUSTERED INDEX [IX_AdAuditLogs_TimestampUtc] ON [dbo].[AdAuditLogs] ([TimestampUtc] DESC);
CREATE NONCLUSTERED INDEX [IX_AdAuditLogs_ActorUsername] ON [dbo].[AdAuditLogs] ([ActorUsername]);
CREATE NONCLUSTERED INDEX [IX_AdAuditLogs_Action_Result] ON [dbo].[AdAuditLogs] ([Action], [Result]);

-- Strict read-only / append-only trigger guard
GO
CREATE TRIGGER [dbo].[TR_AdAuditLogs_PreventUpdateDelete]
ON [dbo].[AdAuditLogs]
FOR UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR ('Audit log records are immutable and cannot be updated or deleted.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO
";

    /// <summary>
    /// PostgreSQL Table DDL Script for Permanent Audit Logs
    /// </summary>
    public const string PostgreSqlDdlScript = @"
-- =========================================================================
-- SAMCHUK HOSPITAL ACTIVE DIRECTORY MANAGEMENT SYSTEM
-- Permanent Audit Logs DDL (PostgreSQL 15 / 16)
-- =========================================================================

CREATE TABLE IF NOT EXISTS ad_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    correlation_id VARCHAR(64) NOT NULL,
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_username VARCHAR(128) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    user_agent VARCHAR(256),
    action VARCHAR(64) NOT NULL,
    target_object VARCHAR(256) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    result VARCHAR(32) NOT NULL,
    reason VARCHAR(512),
    sanitized_details_json JSONB,
    created_utc TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_audit_logs_correlation_id ON ad_audit_logs (correlation_id);
CREATE INDEX IF NOT EXISTS idx_ad_audit_logs_timestamp ON ad_audit_logs (timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_ad_audit_logs_actor ON ad_audit_logs (actor_username);
CREATE INDEX IF NOT EXISTS idx_ad_audit_logs_action_result ON ad_audit_logs (action, result);
";
}

/// <summary>
/// AuditSanitizer:
/// Validates and redacts sensitive parameters from audit log details prior to persistence.
/// </summary>
public static class AuditSanitizer
{
    private static readonly Regex PasswordPattern = new(
        @"""(password|newPassword|confirmPassword|secret|token|hash|credential|pwd)""\s*:\s*""([^""]+)""",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>
    /// Scrubs passwords, tokens, and secret keys from JSON payload strings.
    /// </summary>
    public static string SanitizeJson(string? rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return "{}";
        }

        return PasswordPattern.Replace(rawJson, "\"$1\":\"[REDACTED_BY_AUDIT_POLICY]\"");
    }
}
