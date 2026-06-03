import { LightningElement, api } from "lwc";

/**
 * A single chat bubble. Aligns right for user messages, left for the assistant.
 * Driven by an @api message: { id, role: 'user' | 'agent', text }.
 */
export default class ChatMessage extends LightningElement {
  // 1. Public reactive properties
  @api message;

  // 7. Getters
  get isUser() {
    return this.message?.role === "user";
  }
  get rowClass() {
    return this.isUser
      ? "msg-row slds-grid slds-grid_align-end"
      : "msg-row slds-grid slds-grid_align-start";
  }
  get bubbleClass() {
    return this.isUser ? "bubble bubble_user" : "bubble bubble_agent";
  }
  get text() {
    return this.message?.text;
  }
}
