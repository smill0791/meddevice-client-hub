import { LightningElement, api, wire } from "lwc";
import getCasesByAsset from "@salesforce/apex/CaseController.getCasesByAsset";

/**
 * Lists the support cases linked to a device.
 * Receives `assetId` from its parent and queries its own data reactively.
 * Fires `caseselect` (detail: { caseId }) so a parent can open case detail.
 * Consumes: CaseController.getCasesByAsset
 */
export default class RelatedCasesList extends LightningElement {
  // 1. Public reactive properties
  @api assetId;

  // 2. Private reactive properties
  cases = [];
  isLoading = true;
  error;

  // 3. Wire adapters
  @wire(getCasesByAsset, { assetId: "$assetId" })
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
  handleCaseClick(event) {
    const caseId = event.currentTarget.dataset.id;
    this.dispatchEvent(new CustomEvent("caseselect", { detail: { caseId } }));
  }

  // 7. Getters
  get hasCases() {
    return this.cases.length > 0;
  }

  get isEmpty() {
    return !this.isLoading && !this.error && this.cases.length === 0;
  }
}
