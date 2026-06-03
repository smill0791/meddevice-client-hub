/**
 * Mock conversational backend for the AI Assistant (Agentforce concept).
 * Consumed by: aiChatAssistant.
 *
 * In production this Apex would be replaced by an Agentforce agent configured with
 * Topics (device support, case management, knowledge search) whose Actions map to
 * the same Apex methods the LWC layer already calls. The chat UI is agent-agnostic.
 */
public with sharing class AgentResponseController {

    /** Serializable response shape: a reply plus optional suggested follow-ups. */
    public class AgentReply {
        @AuraEnabled public String message;
        @AuraEnabled public List<String> suggestions;

        public AgentReply(String message, List<String> suggestions) {
            this.message = message;
            this.suggestions = suggestions;
        }
    }

    /**
     * Returns a context-aware mock response for the user's message.
     * Used by: aiChatAssistant
     */
    @AuraEnabled
    public static AgentReply getAgentResponse(String userMessage, Id contextAssetId) {
        String msg = userMessage == null ? '' : userMessage.toLowerCase();

        if (contextAssetId != null && msg.contains('status')) {
            List<Asset> assets = [
                SELECT Name, Status
                FROM Asset
                WHERE Id = :contextAssetId
                WITH SECURITY_ENFORCED
                LIMIT 1
            ];
            if (!assets.isEmpty()) {
                return new AgentReply(
                    'Your device "' + assets[0].Name + '" is currently: ' + assets[0].Status +
                    '. Is there anything else I can help with?',
                    new List<String>{ 'Create a support case', 'Show service history' }
                );
            }
        }

        if (msg.contains('case') || msg.contains('issue') || msg.contains('problem')) {
            return new AgentReply(
                'I can help you create a support case. Would you like me to start a new case for this device?',
                new List<String>{ 'Start a new case', 'Find a troubleshooting article' }
            );
        }

        if (msg.contains('article') || msg.contains('troubleshoot') || msg.contains('how')) {
            return new AgentReply(
                'I can point you to troubleshooting guides. What device category are you working with?',
                new List<String>{ 'Apheresis', 'Blood Collection', 'Cell Therapy', 'Transfusion' }
            );
        }

        return new AgentReply(
            'I can help you check device status, create support cases, or find troubleshooting articles. ' +
            'What would you like to do?',
            new List<String>{ 'Check device status', 'Create a support case', 'Find an article' }
        );
    }
}
