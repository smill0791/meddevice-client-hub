import { createElement } from "lwc";
import AssetList from "c/assetList";
import getAccountAssets from "@salesforce/apex/AssetController.getAccountAssets";

// Drive the @wire adapter from tests via .emit() / .error().
jest.mock(
  "@salesforce/apex/AssetController.getAccountAssets",
  () => {
    const { createApexTestWireAdapter } = require("@salesforce/sfdx-lwc-jest");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

const MOCK_ASSETS = [
  {
    Id: "a1",
    Name: "Trima Accel",
    SerialNumber: "TR-2024-001",
    Status: "Active",
    Device_Category__c: "Apheresis"
  },
  {
    Id: "a2",
    Name: "Reveos",
    SerialNumber: "RV-2024-002",
    Status: "Active",
    Device_Category__c: "Blood Collection"
  }
];

const flush = () => Promise.resolve();

describe("c-asset-list", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders a card per asset when data returns", async () => {
    const element = createElement("c-asset-list", { is: AssetList });
    element.accountId = "001";
    document.body.appendChild(element);

    getAccountAssets.emit(MOCK_ASSETS);
    await flush();

    const cards = element.shadowRoot.querySelectorAll(".asset-card");
    expect(cards.length).toBe(2);
  });

  it("renders the empty state when no assets are returned", async () => {
    const element = createElement("c-asset-list", { is: AssetList });
    element.accountId = "001";
    document.body.appendChild(element);

    getAccountAssets.emit([]);
    await flush();

    expect(element.shadowRoot.querySelector("c-empty-state")).not.toBeNull();
  });

  it("renders the error panel when the wire errors", async () => {
    const element = createElement("c-asset-list", { is: AssetList });
    element.accountId = "001";
    document.body.appendChild(element);

    getAccountAssets.error();
    await flush();

    expect(element.shadowRoot.querySelector("c-error-panel")).not.toBeNull();
  });

  it("fires assetselect with the asset id when a card is clicked", async () => {
    const element = createElement("c-asset-list", { is: AssetList });
    element.accountId = "001";
    document.body.appendChild(element);

    getAccountAssets.emit(MOCK_ASSETS);
    await flush();

    const handler = jest.fn();
    element.addEventListener("assetselect", handler);

    element.shadowRoot.querySelector(".asset-card").click();
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail.assetId).toBe("a1");
  });

  it("filters cards by the search term", async () => {
    const element = createElement("c-asset-list", { is: AssetList });
    element.accountId = "001";
    document.body.appendChild(element);

    getAccountAssets.emit(MOCK_ASSETS);
    await flush();

    const search = element.shadowRoot.querySelector("lightning-input");
    search.value = "reveos";
    search.dispatchEvent(new CustomEvent("change"));
    await flush();

    const cards = element.shadowRoot.querySelectorAll(".asset-card");
    expect(cards.length).toBe(1);
  });
});
