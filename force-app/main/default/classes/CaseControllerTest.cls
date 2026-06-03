@isTest
private class CaseControllerTest {

    @TestSetup
    static void setup() {
        Account acc = new Account(Name = 'Colorado Blood Center', Type = 'Blood Center');
        insert acc;

        Asset a = new Asset(
            Name = 'Spectra Optia',
            AccountId = acc.Id,
            SerialNumber = 'SO-2024-001',
            Status = 'Active',
            Device_Category__c = 'Apheresis'
        );
        insert a;

        List<Case> cases = new List<Case>();
        for (Integer i = 0; i < 3; i++) {
            cases.add(new Case(
                Subject = 'Issue ' + i,
                Status = (i == 0) ? 'Closed' : 'New',
                Priority = 'Medium',
                Origin = 'Portal',
                AccountId = acc.Id,
                AssetId = a.Id,
                Error_Code__c = 'E-100' + i
            ));
        }
        insert cases;
    }

    @isTest
    static void testGetAccountCases() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Test.startTest();
        List<Case> results = CaseController.getAccountCases(acc.Id);
        Test.stopTest();
        System.assertEquals(3, results.size(), 'Should return all cases for the account');
    }

    @isTest
    static void testGetCasesByAsset() {
        Asset a = [SELECT Id FROM Asset LIMIT 1];
        Test.startTest();
        List<Case> results = CaseController.getCasesByAsset(a.Id);
        Test.stopTest();
        System.assertEquals(3, results.size(), 'Should return all cases for the asset');
    }

    @isTest
    static void testGetCaseById() {
        Case existing = [SELECT Id FROM Case LIMIT 1];
        Test.startTest();
        Case result = CaseController.getCaseById(existing.Id);
        Test.stopTest();
        System.assertNotEquals(null, result, 'Should return the requested case');
        System.assertEquals(existing.Id, result.Id, 'Returned case Id should match');
    }

    @isTest
    static void testCreateCase() {
        Asset a = [SELECT Id FROM Asset LIMIT 1];
        Test.startTest();
        Id caseId = CaseController.createCase(
            'Device Error', 'Error code E-4521 on startup', 'High', a.Id, 'E-4521'
        );
        Test.stopTest();
        Case c = [SELECT Subject, Status, Origin, Priority, Error_Code__c, AssetId
                  FROM Case WHERE Id = :caseId];
        System.assertEquals('Device Error', c.Subject, 'Subject should match');
        System.assertEquals('New', c.Status, 'New cases start in New status');
        System.assertEquals('Portal', c.Origin, 'Origin should be Portal');
        System.assertEquals('High', c.Priority, 'Priority should match');
        System.assertEquals('E-4521', c.Error_Code__c, 'Error code should be stored');
        System.assertEquals(a.Id, c.AssetId, 'Case should link to the asset');
    }

    @isTest
    static void testCreateCaseDefaultsPriority() {
        Asset a = [SELECT Id FROM Asset LIMIT 1];
        Test.startTest();
        Id caseId = CaseController.createCase('No priority given', 'desc', null, a.Id, null);
        Test.stopTest();
        Case c = [SELECT Priority FROM Case WHERE Id = :caseId];
        System.assertEquals('Medium', c.Priority, 'Priority should default to Medium when blank');
    }

    @isTest
    static void testSaveFile() {
        Case existing = [SELECT Id FROM Case LIMIT 1];
        String base64 = EncodingUtil.base64Encode(Blob.valueOf('error log contents'));
        Test.startTest();
        Id cvId = CaseController.saveFile(existing.Id, 'error-log.txt', base64);
        Test.stopTest();
        ContentVersion cv = [SELECT Title, PathOnClient FROM ContentVersion WHERE Id = :cvId];
        System.assertEquals('error-log.txt', cv.Title, 'File title should match');
        List<ContentDocumentLink> links = [
            SELECT Id FROM ContentDocumentLink
            WHERE LinkedEntityId = :existing.Id
        ];
        System.assert(!links.isEmpty(), 'File should be linked to the case');
    }

    @isTest
    static void testGetOpenCaseCount() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Test.startTest();
        Integer count = CaseController.getOpenCaseCount(acc.Id);
        Test.stopTest();
        System.assertEquals(2, count, 'Two of three cases are open (one is Closed)');
    }
}
