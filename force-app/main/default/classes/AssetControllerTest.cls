@isTest
private class AssetControllerTest {

    @TestSetup
    static void setup() {
        Account acc = new Account(Name = 'Denver General Hospital', Type = 'Hospital');
        insert acc;

        List<Asset> assets = new List<Asset>();
        for (Integer i = 0; i < 5; i++) {
            assets.add(new Asset(
                Name = 'Trima Accel ' + i,
                AccountId = acc.Id,
                SerialNumber = 'TR-2024-' + String.valueOf(i).leftPad(3, '0'),
                Status = (i == 4) ? 'Under Maintenance' : 'Active',
                Device_Category__c = 'Apheresis',
                Warranty_Expiry__c = Date.today().addDays(200)
            ));
        }
        insert assets;
    }

    @isTest
    static void testGetAccountAssets() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Test.startTest();
        List<Asset> results = AssetController.getAccountAssets(acc.Id);
        Test.stopTest();
        System.assertEquals(5, results.size(), 'Should return all 5 assets for the account');
    }

    @isTest
    static void testGetAccountAssetsNullReturnsEmpty() {
        Test.startTest();
        // Running as an admin user with no Contact -> PortalContext returns null
        List<Asset> results = AssetController.getAccountAssets(null);
        Test.stopTest();
        System.assertEquals(0, results.size(), 'Null account with no portal context returns empty list');
    }

    @isTest
    static void testGetAssetById() {
        Asset a = [SELECT Id FROM Asset LIMIT 1];
        Test.startTest();
        Asset result = AssetController.getAssetById(a.Id);
        Test.stopTest();
        System.assertNotEquals(null, result, 'Should return the requested asset');
        System.assertEquals(a.Id, result.Id, 'Returned asset Id should match');
    }

    @isTest
    static void testGetActiveAssetCount() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Test.startTest();
        Integer count = AssetController.getActiveAssetCount(acc.Id);
        Test.stopTest();
        System.assertEquals(4, count, 'Four of five assets are Active');
    }
}
