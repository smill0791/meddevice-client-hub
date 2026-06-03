import { LightningElement, api } from "lwc";
import getAgentResponse from "@salesforce/apex/AgentResponseController.getAgentResponse";

const GREETING =
  "Hi! I'm your MedDevice assistant. I can check device status, help you open a support case, or find a troubleshooting article. What would you like to do?";

/**
 * Conversational AI assistant UI (Agentforce concept). Renders a message thread
 * of chatMessage children, an input row, and a suggestedActionsPanel of
 * context-aware quick replies. Calls a mock Apex backend imperatively.
 *
 * The UI is intentionally agent-agnostic: swap AgentResponseController for a real
 * Agentforce endpoint and nothing here changes.
 * Consumes: AgentResponseController.getAgentResponse
 */
export default class AiChatAssistant extends LightningElement {
  // 1. Public reactive properties
  @api contextAssetId;

  // 2. Private reactive properties
  messages = [];
  draft = "";
  isThinking = false;
  suggestions = [
    "Check device status",
    "Create a support case",
    "Find an article"
  ];

  _msgSeq = 0;
  _shouldScroll = false;

  // 4. Lifecycle hooks
  connectedCallback() {
    this.messages = [this._buildMessage("agent", GREETING)];
  }

  renderedCallback() {
    if (this._shouldScroll) {
      this._shouldScroll = false;
      const thread = this.template.querySelector(".thread");
      if (thread) {
        thread.scrollTop = thread.scrollHeight;
      }
    }
  }

  // 6. Event handlers
  handleInputChange(event) {
    this.draft = event.target.value;
  }

  handleKeyUp(event) {
    if (event.key === "Enter") {
      this.handleSend();
    }
  }

  handleSend() {
    this._send(this.draft);
  }

  handleSuggestion(event) {
    this._send(event.detail.suggestion);
  }

  // 7. Getters
  get isSendDisabled() {
    return this.isThinking || !this.draft || !this.draft.trim();
  }

  // 8. Private helpers
  async _send(text) {
    const trimmed = (text || "").trim();
    if (!trimmed || this.isThinking) {
      return;
    }
    this.messages = [...this.messages, this._buildMessage("user", trimmed)];
    this.draft = "";
    this.isThinking = true;
    this._shouldScroll = true;

    try {
      const reply = await getAgentResponse({
        userMessage: trimmed,
        contextAssetId: this.contextAssetId
      });
      this.messages = [
        ...this.messages,
        this._buildMessage("agent", reply.message)
      ];
      this.suggestions = reply.suggestions || [];
    } catch {
      // Surface a friendly fallback; details are non-actionable for the user.
      this.messages = [
        ...this.messages,
        this._buildMessage(
          "agent",
          "Sorry, I ran into a problem responding. Please try again."
        )
      ];
    } finally {
      this.isThinking = false;
      this._shouldScroll = true;
    }
  }

  _buildMessage(role, text) {
    this._msgSeq += 1;
    return { id: `m-${this._msgSeq}`, role, text };
  }
}
