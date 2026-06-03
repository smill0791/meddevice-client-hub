import { createElement } from "lwc";
import CaseWizard from "c/caseWizard";
import getAccountAssets from "@salesforce/apex/AssetController.getAccountAssets";

// Drive the @wire device picker via .emit().
jest.mock(
  "@salesforce/apex/AssetController.getAccountAssets",
  () => {
    const { createApexTestWireAdapter } = require("@salesforce/sfdx-lwc-jest");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

// Imperative Apex methods are mocked as resolving functions.
jest.mock(
  "@salesforce/apex/CaseController.createCase",
  () => ({ default: jest.fn(() => Promise.resolve("500000000000001")) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/CaseController.saveFile",
  () => ({ default: jest.fn(() => Promise.resolve("068000000000001")) }),
  { virtual: true }
);

const MOCK_ASSETS = [
  { Id: "a1", Name: "Trima Accel", SerialNumber: "TR-2024-001" }
];

const flush = () => Promise.resolve();

describe("c-case-wizard", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  function findButton(element, label) {
    return Array.from(
      element.shadowRoot.querySelectorAll("lightning-button")
    ).find((b) => b.label === label);
  }

  it("starts on the Select Device step with a device picker", async () => {
    const element = createElement("c-case-wizard", { is: CaseWizard });
    document.body.appendChild(element);

    getAccountAssets.emit(MOCK_ASSETS);
    await flush();

    expect(
      element.shadowRoot.querySelector("lightning-combobox")
    ).not.toBeNull();
    const heading = element.shadowRoot.querySelector(".step-body h3");
    expect(heading.textContent).toContain("Which device");
  });

  it("does not advance past step 1 without a selected device", async () => {
    const element = createElement("c-case-wizard", { is: CaseWizard });
    document.body.appendChild(element);

    getAccountAssets.emit(MOCK_ASSETS);
    await flush();

    findButton(element, "Next").click();
    await flush();

    const heading = element.shadowRoot.querySelector(".step-body h3");
    expect(heading.textContent).toContain("Which device");
  });

  it("advances to the Describe Issue step once a device is selected", async () => {
    const element = createElement("c-case-wizard", { is: CaseWizard });
    document.body.appendChild(element);

    getAccountAssets.emit(MOCK_ASSETS);
    await flush();

    const combo = element.shadowRoot.querySelector("lightning-combobox");
    combo.dispatchEvent(new CustomEvent("change", { detail: { value: "a1" } }));
    await flush();

    findButton(element, "Next").click();
    await flush();

    const heading = element.shadowRoot.querySelector(".step-body h3");
    expect(heading.textContent).toContain("Describe");
  });
});
