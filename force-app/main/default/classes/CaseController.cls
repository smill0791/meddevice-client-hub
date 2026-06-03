/**
 * Controller for support case operations in the MedDevice Client Hub portal.
 * Consumed by: caseWizard, caseList, caseDetailView, relatedCasesList,
 *              recentActivityFeed, dashboardSummaryCards.
 * All SOQL enforces FLS/CRUD via WITH SECURITY_ENFORCED; class runs with sharing.
 */
public with sharing class CaseController {

    /**
     * Retrieves cases for the given account (or the running portal user's account).
     * Used by: caseList, recentActivityFeed
     */
    @AuraEnabled(cacheable=true)
    public static List<Case> getAccountCases(Id accountId) {
        Id acctId = PortalContext.resolveAccountId(accountId);
        if (acctId == null) {
            return new List<Case>();
        }
        return [
            SELECT Id, CaseNumber, Subject, Status, Priority, Origin, CreatedDate,
                   AssetId, Asset.Name, Error_Code__c, Device_Category__c
            FROM Case
            WHERE AccountId = :acctId
            WITH SECURITY_ENFORCED
            ORDER BY CreatedDate DESC
        ];
    }

    /**
     * Retrieves cases linked to a specific device.
     * Used by: relatedCasesList
     */
    @AuraEnabled(cacheable=true)
    public static List<Case> getCasesByAsset(Id assetId) {
        return [
            SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate, Error_Code__c
            FROM Case
            WHERE AssetId = :assetId
            WITH SECURITY_ENFORCED
            ORDER BY CreatedDate DESC
        ];
    }

    /**
     * Retrieves a single case with full detail.
     * Used by: caseDetailView
     */
    @AuraEnabled(cacheable=true)
    public static Case getCaseById(Id caseId) {
        List<Case> cases = [
            SELECT Id, CaseNumber, Subject, Description, Status, Priority, Origin,
                   CreatedDate, ClosedDate, AssetId, Asset.Name, Error_Code__c,
                   Device_Category__c, Resolution_Notes__c, AccountId
            FROM Case
            WHERE Id = :caseId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
        return cases.isEmpty() ? null : cases[0];
    }

    /**
     * Creates a new portal support case linked to a device.
     * Used by: caseWizard (Review & Submit step)
     * NOTE: Not cacheable — performs DML. Uses USER_MODE to enforce FLS/CRUD on insert.
     */
    @AuraEnabled
    public static Id createCase(String subject, String description, String priority,
                                Id assetId, String errorCode) {
        Case c = new Case(
            Subject = subject,
            Description = description,
            Priority = String.isBlank(priority) ? 'Medium' : priority,
            Origin = 'Portal',
            Status = 'New',
            AssetId = assetId,
            Error_Code__c = errorCode
        );
        Id acctId = PortalContext.currentAccountId();
        if (acctId != null) {
            c.AccountId = acctId;
        }
        Database.insert(c, AccessLevel.USER_MODE);
        return c.Id;
    }

    /**
     * Attaches a base64-encoded file to a record (e.g., a newly created case).
     * Used by: caseWizard (Attach Files step, after the case is created)
     * NOTE: Not cacheable — performs DML.
     */
    @AuraEnabled
    public static Id saveFile(Id parentId, String fileName, String base64Data) {
        ContentVersion cv = new ContentVersion(
            Title = fileName,
            PathOnClient = fileName,
            VersionData = EncodingUtil.base64Decode(base64Data),
            FirstPublishLocationId = parentId,
            Origin = 'H'
        );
        Database.insert(cv, AccessLevel.USER_MODE);
        return cv.Id;
    }

    /**
     * Count of open (not closed) cases for the dashboard "Open Cases" card.
     * Used by: dashboardSummaryCards
     */
    @AuraEnabled(cacheable=true)
    public static Integer getOpenCaseCount(Id accountId) {
        Id acctId = PortalContext.resolveAccountId(accountId);
        if (acctId == null) {
            return 0;
        }
        return [
            SELECT COUNT()
            FROM Case
            WHERE AccountId = :acctId AND IsClosed = false
            WITH SECURITY_ENFORCED
        ];
    }
}
