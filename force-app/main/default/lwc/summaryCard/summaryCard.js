import { LightningElement, api } from "lwc";

/**
 * Reusable dashboard metric card: an icon, a big number, and a label.
 * Driven entirely by @api inputs so the parent (dashboardSummaryCards) owns
 * the data fetching.
 *
 * Usage: <c-summary-card label="Open Cases" value="2" icon-name="standard:case">
 */
export default class SummaryCard extends LightningElement {
  // 1. Public reactive properties
  @api label;
  @api value;
  @api iconName = "standard:metrics";
  @api accent = "#0066b3";
  @api isLoading = false;

  // 7. Getters
  get cardStyle() {
    return `--accent: ${this.accent};`;
  }

  get displayValue() {
    return this.value === undefined || this.value === null ? "—" : this.value;
  }
}
