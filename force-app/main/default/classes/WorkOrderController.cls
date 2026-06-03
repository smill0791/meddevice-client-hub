/**
 * Controller for field-service Work Order operations in the portal.
 * Consumed by: serviceHistoryTimeline, dashboardSummaryCards.
 * All SOQL enforces FLS/CRUD via WITH SECURITY_ENFORCED; class runs with sharing.
 */
public with sharing class WorkOrderController {

    /**
     * Retrieves the service-visit history for a device, newest first.
     * Used by: serviceHistoryTimeline
     */
    @AuraEnabled(cacheable=true)
    public static List<Work_Order__c> getWorkOrdersByAsset(Id assetId) {
        return [
            SELECT Id, Name, Status__c, Technician_Name__c, Scheduled_Date__c,
                   Completed_Date__c, Parts_Required__c, Service_Notes__c,
                   Case__c, Case__r.CaseNumber
            FROM Work_Order__c
            WHERE Asset__c = :assetId
            WITH SECURITY_ENFORCED
            ORDER BY Scheduled_Date__c DESC NULLS LAST
        ];
    }

    /**
     * Count of upcoming/in-flight service visits for the dashboard
     * "Upcoming Service Visits" card.
     * Used by: dashboardSummaryCards
     */
    @AuraEnabled(cacheable=true)
    public static Integer getUpcomingVisitCount(Id accountId) {
        Id acctId = PortalContext.resolveAccountId(accountId);
        if (acctId == null) {
            return 0;
        }
        return [
            SELECT COUNT()
            FROM Work_Order__c
            WHERE Asset__r.AccountId = :acctId
              AND Status__c IN ('New', 'Scheduled', 'In Progress')
            WITH SECURITY_ENFORCED
        ];
    }
}
