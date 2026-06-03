import { LightningElement, api } from "lwc";

/**
 * Renders the assistant's context-aware suggested replies as clickable chips.
 * Fires `suggestionclick` (detail: { suggestion }) when one is chosen.
 */
export default class SuggestedActionsPanel extends LightningElement {
  // 1. Public reactive properties
  @api suggestions = [];

  // 6. Event handlers
  handleClick(event) {
    const suggestion = event.currentTarget.dataset.value;
    this.dispatchEvent(
      new CustomEvent("suggestionclick", { detail: { suggestion } })
    );
  }

  // 7. Getters
  get hasSuggestions() {
    return this.suggestions && this.suggestions.length > 0;
  }
}
