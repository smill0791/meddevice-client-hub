import { LightningElement, api, wire } from "lwc";
import getOpenCaseCount from "@salesforce/apex/CaseController.getOpenCaseCount";
import getUpcomingVisitCount from "@salesforce/apex/WorkOrderController.getUpcomingVisitCount";
import getActiveAssetCount from "@salesforce/apex/AssetController.getActiveAssetCount";

/**
 * Dashboard header: composes three summaryCard children fed by three
 * account-scoped count queries. Demonstrates parent-owns-data, child-renders-UI.
 * Consumes: CaseController.getOpenCaseCount, WorkOrderController.getUpcomingVisitCount,
 *           AssetController.getActiveAssetCount
 */
export default class DashboardSummaryCards extends LightningElement {
  // 1. Public reactive properties
  @api accountId;

  // 2. Private reactive properties
  openCases;
  openCasesLoading = true;

  upcomingVisits;
  upcomingVisitsLoading = true;

  activeDevices;
  activeDevicesLoading = true;

  // 3. Wire adapters
  @wire(getOpenCaseCount, { accountId: "$accountId" })
  wiredOpenCases({ data, error }) {
    this.openCasesLoading = false;
    if (data !== undefined && data !== null) {
      this.openCases = data;
    } else if (error) {
      this.openCases = 0;
    }
  }

  @wire(getUpcomingVisitCount, { accountId: "$accountId" })
  wiredVisits({ data, error }) {
    this.upcomingVisitsLoading = false;
    if (data !== undefined && data !== null) {
      this.upcomingVisits = data;
    } else if (error) {
      this.upcomingVisits = 0;
    }
  }

  @wire(getActiveAssetCount, { accountId: "$accountId" })
  wiredDevices({ data, error }) {
    this.activeDevicesLoading = false;
    if (data !== undefined && data !== null) {
      this.activeDevices = data;
    } else if (error) {
      this.activeDevices = 0;
    }
  }
}
