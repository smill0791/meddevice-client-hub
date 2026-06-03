import { LightningElement, api, wire } from "lwc";
import getWorkOrdersByAsset from "@salesforce/apex/WorkOrderController.getWorkOrdersByAsset";

/**
 * Vertical timeline of field-service visits (work orders) for a device.
 * Receives `assetId` from its parent and queries its own data reactively.
 * Consumes: WorkOrderController.getWorkOrdersByAsset
 */
export default class ServiceHistoryTimeline extends LightningElement {
  // 1. Public reactive properties
  @api assetId;

  // 2. Private reactive properties
  workOrders = [];
  isLoading = true;
  error;

  // 3. Wire adapters
  @wire(getWorkOrdersByAsset, { assetId: "$assetId" })
  wiredWorkOrders({ data, error }) {
    this.isLoading = false;
    if (data) {
      this.workOrders = data.map((wo) => ({
        ...wo,
        displayDate: wo.Completed_Date__c || wo.Scheduled_Date__c,
        isCompleted: wo.Status__c === "Completed"
      }));
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.workOrders = [];
    }
  }

  // 7. Getters
  get hasWorkOrders() {
    return this.workOrders.length > 0;
  }

  get isEmpty() {
    return !this.isLoading && !this.error && this.workOrders.length === 0;
  }
}
