# MedDevice Client Hub

A customer-facing **Salesforce Experience Cloud** portal for medical-device support. Hospital biomedical engineers, blood-bank managers, and lab technicians use it to manage their installed devices, submit and track service requests, follow field-service visits, and get self-service help through an AI assistant — all in a clean, mobile-responsive UI built with Lightning Web Components.

The portal is modeled on the medical-device support domain (Terumo BCT–style devices such as Trima Accel, Reveos, and Spectra Optia) and demonstrates production-grade Experience Cloud, LWC, and Agentforce-ready patterns.

---

## Highlights

- **20 Lightning Web Components** organized into a reusable foundation layer plus four feature areas (Assets, Cases, Dashboard, AI Assistant).
- **Parent–child architecture showcase** — `assetDetailContainer` owns selection state and drives three reactive children via `@api`, while children communicate up via `CustomEvent`.
- **Multi-step Case Wizard** — a four-step guided flow (Select Device → Describe Issue → Attach Files → Review & Submit) with per-step validation and real client-side file staging that uploads to the new case on submit.
- **Agentforce-ready AI assistant** — an agent-agnostic chat UI backed by a mock Apex topic router that can be swapped for a real Agentforce endpoint without UI changes.
- **Security-first Apex** — every controller is `with sharing`, every query uses `WITH SECURITY_ENFORCED`, and all DML runs in `USER_MODE`.
- **Tested** — 24 Apex tests (88–100% per-class coverage) and 18 Jest tests covering rendering, empty/error states, events, and wizard navigation.
- **Polished UX** — every data component handles loading (shimmer skeletons), empty, and error states consistently via shared utility components.

---

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Platform | Salesforce Experience Cloud (Developer Edition)              |
| UI       | Lightning Web Components (LWC)                               |
| Styling  | Salesforce Lightning Design System (SLDS) tokens & utilities |
| Backend  | Apex (bulkified, security-enforced)                          |
| Testing  | Jest (`@salesforce/sfdx-lwc-jest`) + Apex `@isTest`          |
| Tooling  | Salesforce CLI (`sf`), ESLint, Prettier                      |

---

## Architecture

### Component catalog

**Foundation / shared utilities**

| Component         | Responsibility                                                         |
| ----------------- | ---------------------------------------------------------------------- |
| `errorUtils`      | JS module that reduces any Apex/LDS/JS error shape to readable strings |
| `errorPanel`      | Inline error display (consumes `errorUtils`)                           |
| `loadingSkeleton` | Shimmer placeholders — `card`, `list`, and `detail` variants           |
| `emptyState`      | Icon + message + optional CTA for no-data states                       |
| `statusBadge`     | Color-coded status pill shared across cases, assets, and work orders   |

**Assets — "My Devices"**

| Component                | Responsibility                                          |
| ------------------------ | ------------------------------------------------------- |
| `assetDetailContainer`   | Parent orchestrator; owns selected-device state         |
| `assetList`              | Searchable, filterable device grid; emits `assetselect` |
| `assetDetailsPanel`      | Device detail + warranty status                         |
| `serviceHistoryTimeline` | Work-order visit history for the device                 |
| `relatedCasesList`       | Cases linked to the device                              |

**Support Cases**

| Component        | Responsibility                                                 |
| ---------------- | -------------------------------------------------------------- |
| `caseWizard`     | Multi-step case creation with file upload (flagship component) |
| `caseList`       | Filterable case list; navigates to case detail                 |
| `caseDetailView` | Tabbed case view (Overview / Comments / Timeline)              |

**Dashboard — Home**

| Component               | Responsibility                                               |
| ----------------------- | ------------------------------------------------------------ |
| `dashboardSummaryCards` | Parent composing three metric cards from three count queries |
| `summaryCard`           | Reusable metric card                                         |
| `recentActivityFeed`    | Most-recent case activity                                    |
| `quickActionPanel`      | One-click actions (report issue, ask AI, browse knowledge)   |

**AI Assistant**

| Component               | Responsibility                                                |
| ----------------------- | ------------------------------------------------------------- |
| `aiChatAssistant`       | Chat shell; manages the conversation and calls the mock agent |
| `chatMessage`           | Individual message bubble                                     |
| `suggestedActionsPanel` | Context-aware quick-reply chips                               |

### Apex controllers

All classes are `with sharing` and enforce FLS/CRUD.

| Class                     | Purpose                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `PortalContext`           | Resolves the running portal user's Account (falls back gracefully for internal users) |
| `AssetController`         | Account devices, device detail, active-device count                                   |
| `CaseController`          | Account/asset cases, case detail, case creation, file upload, open-case count         |
| `WorkOrderController`     | Service-visit history, upcoming-visit count                                           |
| `KnowledgeController`     | Curated troubleshooting articles (mock; swappable for Salesforce Knowledge)           |
| `AgentResponseController` | Mock context-aware agent responses (Agentforce stand-in)                              |

### Data model

Standard objects are configured rather than replaced; two custom objects model field service.

- **Account** — `Region__c`
- **Contact** — `Portal_Role__c`, `Department__c`
- **Asset** — `Device_Category__c`, `Warranty_Expiry__c`, `Error_Code__c`
- **Case** — `Error_Code__c`, `Resolution_Notes__c`, `Device_Category__c` (cross-object formula from the related Asset); uses the **standard `AssetId`** lookup
- **Work_Order\_\_c** — case/asset lookups, technician, scheduled/completed dates, status, parts, notes
- **Service_Contract\_\_c** — account lookup, term dates, coverage level, SLA response hours

Field- and object-level access is granted through the **`MedDevice_Portal_User`** permission set.

---

## Project Structure

```
force-app/main/default/
├── classes/        Apex controllers + tests
├── lwc/            20 Lightning Web Components
├── objects/        Custom fields & custom objects
└── permissionsets/ MedDevice_Portal_User
scripts/apex/
└── loadSampleData.apex   Seed data for a populated demo
```

---

## Getting Started

> Prerequisites: [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`), Node.js LTS, and a Dev/Scratch org with **Digital Experiences** enabled.

```bash
# 1. Authorize your org
sf org login web --alias meddevice-dev --set-default

# 2. Deploy all metadata
sf project deploy start --source-dir force-app --target-org meddevice-dev

# 3. Grant access to the running user (and your portal users)
sf org assign permset --name MedDevice_Portal_User --target-org meddevice-dev

# 4. Load sample data (accounts, devices, cases, work orders, contracts)
sf apex run --file scripts/apex/loadSampleData.apex --target-org meddevice-dev

# 5. Install JS deps for Jest
npm install
```

### Remaining manual steps (browser-only)

Experience Cloud site creation and page assembly can't be scripted via the CLI:

1. **Setup → Digital Experiences → Settings** — enable and choose a domain.
2. **All Sites → New** — create a site from the _Customer Service_ (or _Build Your Own / LWR_) template.
3. In **Experience Builder**, drop the components onto pages:
   - _Home_ — `dashboardSummaryCards`, `recentActivityFeed`, `quickActionPanel`
   - _My Devices_ — `assetDetailContainer`
   - _Support Cases_ — `caseList` and `caseWizard`
   - _AI Assistant_ — `aiChatAssistant`
   - _Case record page_ — `caseDetailView`
4. Configure sharing sets so portal users see only their Account's records, then **Publish**.

All components are exposed to `lightningCommunity__Page` / `lightningCommunity__Default`, so they appear in the Builder palette automatically once the site exists.

---

## Testing

```bash
# LWC unit tests
npm run test:unit
npm run test:unit:coverage

# Apex tests
sf apex run test --target-org meddevice-dev --code-coverage --result-format human --wait 10
```

---

## Design Notes

- **Standard `AssetId` on Case** is used instead of a redundant custom lookup, keeping the model aligned with platform conventions and the sample-data script.
- **`KnowledgeController` returns curated articles** so the portal is fully demoable without enabling Salesforce Knowledge; the method shape matches a real `KnowledgeArticleVersion` query for a drop-in swap.
- **The AI layer is intentionally agent-agnostic.** `AgentResponseController` mocks the responses a configured Agentforce agent would return; the chat UI is unchanged whether the backend is the mock, Agentforce, or any other service.
- **Account context is resolved server-side** by `PortalContext`, so components work for a logged-in portal user without hardcoding an Account ID (an optional `accountId` property is available for admin preview/testing).

---

## License

Provided as-is for demonstration and portfolio purposes.
