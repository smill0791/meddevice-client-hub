import { createElement } from "lwc";
import EmptyState from "c/emptyState";

describe("c-empty-state", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders the title and message", () => {
    const element = createElement("c-empty-state", { is: EmptyState });
    element.title = "No Devices";
    element.message = "None found";
    document.body.appendChild(element);

    expect(element.shadowRoot.querySelector("h3").textContent).toBe(
      "No Devices"
    );
    expect(element.shadowRoot.querySelector("p").textContent).toBe(
      "None found"
    );
  });

  it("renders a CTA and fires the action event when clicked", () => {
    const element = createElement("c-empty-state", { is: EmptyState });
    element.actionLabel = "Contact Support";
    document.body.appendChild(element);

    const handler = jest.fn();
    element.addEventListener("action", handler);

    const button = element.shadowRoot.querySelector("lightning-button");
    expect(button).not.toBeNull();
    button.click();
    expect(handler).toHaveBeenCalled();
  });

  it("renders no CTA when no actionLabel is provided", () => {
    const element = createElement("c-empty-state", { is: EmptyState });
    document.body.appendChild(element);

    expect(element.shadowRoot.querySelector("lightning-button")).toBeNull();
  });
});
