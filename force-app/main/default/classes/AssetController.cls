/**
 * Controller for device/asset operations in the MedDevice Client Hub portal.
 * Consumed by: assetList, assetDetailsPanel, assetDetailContainer, caseWizard,
 *              dashboardSummaryCards.
 * All SOQL enforces FLS/CRUD via WITH SECURITY_ENFORCED; class runs with sharing.
 */
public with sharing class AssetController {

    /**
     * Retrieves installed devices for the given account (or the running portal
     * user's account when accountId is null).
     * Used by: assetList, caseWizard (asset selection step)
     */
    @AuraEnabled(cacheable=true)
    public static List<Asset> getAccountAssets(Id accountId) {
        Id acctId = PortalContext.resolveAccountId(accountId);
        if (acctId == null) {
            return new List<Asset>();
        }
        return [
            SELECT Id, Name, SerialNumber, Status, InstallDate, Product2.Name,
                   Device_Category__c, Warranty_Expiry__c, Error_Code__c, Account.Name
            FROM Asset
            WHERE AccountId = :acctId
            WITH SECURITY_ENFORCED
            ORDER BY InstallDate DESC
        ];
    }

    /**
     * Retrieves a single device with full detail.
     * Used by: assetDetailsPanel
     */
    @AuraEnabled(cacheable=true)
    public static Asset getAssetById(Id assetId) {
        List<Asset> assets = [
            SELECT Id, Name, SerialNumber, Status, InstallDate, Product2.Name,
                   Device_Category__c, Warranty_Expiry__c, Error_Code__c,
                   AccountId, Account.Name
            FROM Asset
            WHERE Id = :assetId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
        return assets.isEmpty() ? null : assets[0];
    }

    /**
     * Count of active devices for the dashboard "Active Devices" card.
     * Used by: dashboardSummaryCards
     */
    @AuraEnabled(cacheable=true)
    public static Integer getActiveAssetCount(Id accountId) {
        Id acctId = PortalContext.resolveAccountId(accountId);
        if (acctId == null) {
            return 0;
        }
        return [
            SELECT COUNT()
            FROM Asset
            WHERE AccountId = :acctId AND Status = 'Active'
            WITH SECURITY_ENFORCED
        ];
    }
}
