import { LightningElement, api, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getAccountCases from "@salesforce/apex/CaseController.getAccountCases";

/**
 * Compact feed of the account's most recent case activity for the home page.
 * Reuses CaseController.getAccountCases (already sorted newest-first) and shows
 * the top N. Clicking an item navigates to the case record.
 */
export default class RecentActivityFeed extends NavigationMixin(
  LightningElement
) {
  // 1. Public reactive properties
  @api accountId;
  @api maxItems = 5;

  // 2. Private reactive properties
  cases = [];
  isLoading = true;
  error;

  // 3. Wire adapters
  @wire(getAccountCases, { accountId: "$accountId" })
  wiredCases({ data, error }) {
    this.isLoading = false;
    if (data) {
      this.cases = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.cases = [];
    }
  }

  // 6. Event handlers
  handleClick(event) {
    const caseId = event.currentTarget.dataset.id;
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: caseId,
        objectApiName: "Case",
        actionName: "view"
      }
    });
  }

  // 7. Getters
  get recentCases() {
    const limit = parseInt(this.maxItems, 10) || 5;
    return this.cases.slice(0, limit);
  }
  get hasActivity() {
    return this.recentCases.length > 0;
  }
  get isEmpty() {
    return !this.isLoading && !this.error && this.recentCases.length === 0;
  }
}
