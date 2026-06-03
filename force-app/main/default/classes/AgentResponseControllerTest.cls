@isTest
private class AgentResponseControllerTest {

    @TestSetup
    static void setup() {
        Account acc = new Account(Name = 'Pikes Peak Blood Services', Type = 'Blood Center');
        insert acc;
        insert new Asset(Name = 'Reveos', AccountId = acc.Id, SerialNumber = 'RV-2024-001',
                         Status = 'Active', Device_Category__c = 'Blood Collection');
    }

    @isTest
    static void testStatusResponseWithAsset() {
        Asset a = [SELECT Id FROM Asset LIMIT 1];
        Test.startTest();
        AgentResponseController.AgentReply reply =
            AgentResponseController.getAgentResponse('What is the status of my device?', a.Id);
        Test.stopTest();
        System.assert(reply.message.contains('Reveos'), 'Status reply should name the device');
        System.assert(reply.message.contains('Active'), 'Status reply should include the status');
    }

    @isTest
    static void testCaseResponse() {
        AgentResponseController.AgentReply reply =
            AgentResponseController.getAgentResponse('I have an issue', null);
        System.assert(reply.message.containsIgnoreCase('case'), 'Should offer to create a case');
        System.assert(reply.suggestions.size() > 0, 'Should include suggested actions');
    }

    @isTest
    static void testArticleResponse() {
        AgentResponseController.AgentReply reply =
            AgentResponseController.getAgentResponse('How do I troubleshoot this?', null);
        System.assert(reply.message.containsIgnoreCase('troubleshooting') ||
                      reply.message.containsIgnoreCase('guide'), 'Should offer articles');
    }

    @isTest
    static void testDefaultResponse() {
        AgentResponseController.AgentReply reply =
            AgentResponseController.getAgentResponse('hello there', null);
        System.assertNotEquals(null, reply.message, 'Default response should not be null');
        System.assertEquals(3, reply.suggestions.size(), 'Default offers three suggestions');
    }

    @isTest
    static void testNullMessage() {
        AgentResponseController.AgentReply reply =
            AgentResponseController.getAgentResponse(null, null);
        System.assertNotEquals(null, reply.message, 'Null message handled gracefully');
    }
}
