@isTest
private class KnowledgeControllerTest {

    @isTest
    static void testGetAllArticles() {
        Test.startTest();
        List<KnowledgeController.Article> results = KnowledgeController.getArticles(null);
        Test.stopTest();
        System.assert(results.size() > 0, 'Should return the full curated article set');
    }

    @isTest
    static void testGetArticlesFilteredByCategory() {
        Test.startTest();
        List<KnowledgeController.Article> results = KnowledgeController.getArticles('Apheresis');
        Test.stopTest();
        System.assert(results.size() > 0, 'Should return Apheresis articles');
        for (KnowledgeController.Article a : results) {
            System.assertEquals('Apheresis', a.deviceCategory, 'All results match the filter');
        }
    }

    @isTest
    static void testGetArticlesUnknownCategory() {
        Test.startTest();
        List<KnowledgeController.Article> results = KnowledgeController.getArticles('Nonexistent');
        Test.stopTest();
        System.assertEquals(0, results.size(), 'Unknown category returns no articles');
    }
}
