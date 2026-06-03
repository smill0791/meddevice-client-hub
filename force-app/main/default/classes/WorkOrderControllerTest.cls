@isTest
private class WorkOrderControllerTest {

    @TestSetup
    static void setup() {
        Account acc = new Account(Name = 'Front Range Medical Center', Type = 'Hospital');
        insert acc;

        Asset a = new Asset(
            Name = 'COBE Spectra',
            AccountId = acc.Id,
            SerialNumber = 'CS-2024-001',
            Status = 'Active',
            Device_Category__c = 'Apheresis'
        );
        insert a;

        Case c = new Case(Subject = 'PM due', Status = 'New', Origin = 'Portal',
                          AccountId = acc.Id, AssetId = a.Id);
        insert c;

        List<Work_Order__c> wos = new List<Work_Order__c>{
            new Work_Order__c(Asset__c = a.Id, Case__c = c.Id, Status__c = 'Scheduled',
                Technician_Name__c = 'Alex Tech', Scheduled_Date__c = Date.today().addDays(5)),
            new Work_Order__c(Asset__c = a.Id, Status__c = 'Completed',
                Technician_Name__c = 'Jordan Tech', Scheduled_Date__c = Date.today().addDays(-30),
                Completed_Date__c = Date.today().addDays(-29)),
            new Work_Order__c(Asset__c = a.Id, Status__c = 'New',
                Scheduled_Date__c = Date.today().addDays(10))
        };
        insert wos;
    }

    @isTest
    static void testGetWorkOrdersByAsset() {
        Asset a = [SELECT Id FROM Asset LIMIT 1];
        Test.startTest();
        List<Work_Order__c> results = WorkOrderController.getWorkOrdersByAsset(a.Id);
        Test.stopTest();
        System.assertEquals(3, results.size(), 'Should return all work orders for the asset');
    }

    @isTest
    static void testGetUpcomingVisitCount() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Test.startTest();
        Integer count = WorkOrderController.getUpcomingVisitCount(acc.Id);
        Test.stopTest();
        System.assertEquals(2, count, 'Two work orders are New/Scheduled/In Progress');
    }
}
