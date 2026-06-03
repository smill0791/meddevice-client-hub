/**
 * Controller for self-service troubleshooting articles in the portal.
 * Consumed by: suggestedActionsPanel, aiChatAssistant (knowledge suggestions).
 *
 * NOTE: For the demo this returns a curated in-memory article set so the portal
 * works without Salesforce Knowledge being enabled. In production these methods
 * would query KnowledgeArticleVersion (filtered by PublishStatus = 'Online' and
 * the article's Device_Category__c) with the same return shape — the LWC layer
 * is unchanged.
 */
public with sharing class KnowledgeController {

    /** Lightweight, serializable article shape returned to LWC. */
    public class Article {
        @AuraEnabled public String id;
        @AuraEnabled public String title;
        @AuraEnabled public String deviceCategory;
        @AuraEnabled public String summary;
        @AuraEnabled public String url;

        public Article(String id, String title, String deviceCategory, String summary, String url) {
            this.id = id;
            this.title = title;
            this.deviceCategory = deviceCategory;
            this.summary = summary;
            this.url = url;
        }
    }

    private static List<Article> allArticles() {
        return new List<Article>{
            new Article('kb-001', 'Resolving Error Code E-4521 on Startup', 'Apheresis',
                'Step-by-step recovery when the centrifuge fails its self-test on power-up.', '#'),
            new Article('kb-002', 'Calibration Drift: Causes and Recalibration', 'Apheresis',
                'How to recognize calibration drift and run the guided recalibration routine.', '#'),
            new Article('kb-003', 'Replacing the Disposable Tubing Set', 'Blood Collection',
                'Safe replacement procedure for single-use tubing sets between donations.', '#'),
            new Article('kb-004', 'Clearing a Fluid-Path Occlusion Alarm', 'Blood Collection',
                'Diagnosing and clearing occlusion alarms without compromising the collection.', '#'),
            new Article('kb-005', 'Cell Therapy Chamber Sterilization', 'Cell Therapy',
                'Recommended sterilization cycle and validation checks for processing chambers.', '#'),
            new Article('kb-006', 'Display Panel Unresponsive — First Steps', 'Transfusion',
                'Power-cycle sequence and firmware checks when the touchscreen stops responding.', '#'),
            new Article('kb-007', 'Preventive Maintenance Schedule Overview', 'Apheresis',
                'Recommended PM intervals and what each scheduled visit covers.', '#'),
            new Article('kb-008', 'Interpreting Self-Test Diagnostic Codes', 'Transfusion',
                'A reference table of common diagnostic codes and their corrective actions.', '#')
        };
    }

    /**
     * Returns troubleshooting articles, optionally filtered by device category.
     * Used by: suggestedActionsPanel
     */
    @AuraEnabled(cacheable=true)
    public static List<Article> getArticles(String deviceCategory) {
        if (String.isBlank(deviceCategory)) {
            return allArticles();
        }
        List<Article> filtered = new List<Article>();
        for (Article a : allArticles()) {
            if (a.deviceCategory == deviceCategory) {
                filtered.add(a);
            }
        }
        return filtered;
    }
}
