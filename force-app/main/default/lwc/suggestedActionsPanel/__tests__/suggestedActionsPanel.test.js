import { createElement } from "lwc";
import SuggestedActionsPanel from "c/suggestedActionsPanel";

describe("c-suggested-actions-panel", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders one chip per suggestion", () => {
    const element = createElement("c-suggested-actions-panel", {
      is: SuggestedActionsPanel
    });
    element.suggestions = ["Check status", "Open a case", "Find an article"];
    document.body.appendChild(element);

    const chips = element.shadowRoot.querySelectorAll(".suggestion-chip");
    expect(chips.length).toBe(3);
  });

  it("fires suggestionclick with the chosen value", () => {
    const element = createElement("c-suggested-actions-panel", {
      is: SuggestedActionsPanel
    });
    element.suggestions = ["Check status"];
    document.body.appendChild(element);

    const handler = jest.fn();
    element.addEventListener("suggestionclick", handler);

    element.shadowRoot.querySelector(".suggestion-chip").click();
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail.suggestion).toBe("Check status");
  });

  it("renders nothing when there are no suggestions", () => {
    const element = createElement("c-suggested-actions-panel", {
      is: SuggestedActionsPanel
    });
    element.suggestions = [];
    document.body.appendChild(element);

    expect(element.shadowRoot.querySelector(".suggestion-chip")).toBeNull();
  });
});
