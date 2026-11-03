namespace SamchukHospital.AdManagement.Domain.Entities;

public class AdOrganizationalUnit
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DistinguishedName { get; set; } = string.Empty;
    public string? ParentDn { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool ProtectedFromAccidentalDeletion { get; set; } = true;
    public int UserCount { get; set; }
    public int ComputerCount { get; set; }
    public int SubOuCount { get; set; }
    public List<AdOrganizationalUnit> Children { get; set; } = new();
}

public class AdGroup
{
    public string Id { get; set; } = string.Empty;
    public string SamAccountName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string DistinguishedName { get; set; } = string.Empty;
    public string Scope { get; set; } = "Global"; // Global, Universal, DomainLocal
    public string Type { get; set; } = "Security"; // Security, Distribution
    public string Description { get; set; } = string.Empty;
    public string OuPath { get; set; } = string.Empty;
    public string? MailAddress { get; set; }
    public int MemberCount { get; set; }
    public List<GroupMemberRef> Members { get; set; } = new();
    public List<string> NestedGroups { get; set; } = new();
}

public class GroupMemberRef
{
    public string Id { get; set; } = string.Empty;
    public string SamAccountName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Type { get; set; } = "User";
    public string? Department { get; set; }
}

public class AuditEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RequestId { get; set; } = string.Empty;
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    public string Actor { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string TargetObject { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public string Result { get; set; } = "Success";
    public string ClientIp { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
}
