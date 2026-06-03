import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";

/**
 * Home-page panel of one-click actions. Navigates to the configured Experience
 * Cloud pages (defaults match the recommended site nav) and also dispatches a
 * `quickaction` event so a host page can react if it prefers.
 */
export default class QuickActionPanel extends NavigationMixin(
  LightningElement
) {
  // 1. Public reactive properties — configurable target page API names
  @api newCasePageName = "Support_Cases";
  @api aiAssistantPageName = "AI_Assistant";
  @api knowledgePageName = "Knowledge";

  // 7. Getters
  get actions() {
    return [
      {
        key: "report",
        label: "Report an Issue",
        description: "Open a new support case",
        iconName: "utility:new_window",
        variant: "brand",
        page: this.newCasePageName
      },
      {
        key: "ai",
        label: "Ask AI Assistant",
        description: "Get instant help",
        iconName: "utility:einstein",
        variant: "neutral",
        page: this.aiAssistantPageName
      },
      {
        key: "knowledge",
        label: "Browse Knowledge",
        description: "Self-service guides",
        iconName: "utility:knowledge_base",
        variant: "neutral",
        page: this.knowledgePageName
      }
    ];
  }

  // 6. Event handlers
  handleAction(event) {
    const key = event.currentTarget.dataset.key;
    const action = this.actions.find((a) => a.key === key);

    this.dispatchEvent(
      new CustomEvent("quickaction", { detail: { action: key } })
    );

    if (action?.page) {
      this[NavigationMixin.Navigate]({
        type: "comm__namedPage",
        attributes: { name: action.page }
      });
    }
  }
}
