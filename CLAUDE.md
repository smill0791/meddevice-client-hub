# MedDevice Client Hub — Experience Cloud Project

## Project Context

This is an Experience Cloud portal project designed as an interview demo for a **Sr Salesforce Developer (AgentForce & Experience Cloud)** role at **Terumo BCT**, a medical device company. The portal simulates a customer-facing support hub where hospital biomedical engineers, blood bank managers, and lab technicians manage their installed Terumo equipment, submit service requests, and access self-service support.

**The primary goal is demonstrating UI/UX maturity, clean LWC architecture, and Experience Cloud expertise — not backend complexity.**

---

## Technology Stack

- **Platform:** Salesforce Developer Edition Org with Experience Cloud enabled
- **Frontend:** Lightning Web Components (LWC) — no Aura unless wrapping an LWC for Experience Cloud compatibility
- **Backend:** Apex classes and triggers following bulkified patterns
- **Styling:** Salesforce Lightning Design System (SLDS) tokens and utilities — no external CSS frameworks
- **Testing:** Jest for LWC unit tests, Apex test classes with `@isTest`
- **Tooling:** Salesforce CLI (`sf`), VS Code with Salesforce Extension Pack

---

## Coding Conventions

### LWC File Naming

- Component folders and files use **camelCase**: `caseWizard/caseWizard.js`
- In HTML markup, components render as **kebab-case** with `c-` namespace prefix: `<c-case-wizard>`
- Component names should be descriptive and scoped: `supportCaseForm`, not `form`
- All project components use the default `c` namespace

### LWC JavaScript Conventions

```javascript
// Imports grouped: Salesforce modules first, then Apex, then custom
import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAssets from '@salesforce/apex/AssetController.getAssets';
import { reduceErrors } from 'c/errorUtils';

// Class naming: PascalCase matching the filename
export default class DeviceOverviewCard extends LightningElement {
    // 1. Public reactive properties (@api) — always first
    @api recordId;
    @api accountId;

    // 2. Private reactive properties (tracked by default since Spring '20)
    assets = [];
    isLoading = true;
    error;

    // 3. Wire adapters
    @wire(getAssets, { accountId: '$accountId' })
    wiredAssets({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.assets = data;
            this.error = undefined;
        } else if (error) {
            this.error = reduceErrors(error);
            this.assets = [];
        }
    }

    // 4. Lifecycle hooks
    connectedCallback() { }
    renderedCallback() { }
    disconnectedCallback() { }

    // 5. Public methods (@api)
    @api
    refresh() { }

    // 6. Event handlers (prefixed with "handle")
    handleAssetSelect(event) {
        const assetId = event.detail.assetId;
        this.dispatchEvent(new CustomEvent('assetselect', {
            detail: { assetId },
            bubbles: false,
            composed: false
        }));
    }

    // 7. Getters (computed properties)
    get hasAssets() {
        return this.assets && this.assets.length > 0;
    }

    // 8. Private helper methods (prefixed with underscore)
    _formatDate(dateString) { }
}
```

### LWC HTML Conventions

```html
<template>
    <!-- Always handle loading state -->
    <template lwc:if={isLoading}>
        <c-loading-skeleton variant="card" count="3"></c-loading-skeleton>
    </template>

    <!-- Always handle empty state -->
    <template lwc:elseif={isEmpty}>
        <c-empty-state
            title="No Devices Found"
            message="Your account has no registered devices."
            icon-name="standard:asset_object"
            action-label="Contact Support"
            onaction={handleContactSupport}>
        </c-empty-state>
    </template>

    <!-- Always handle error state -->
    <template lwc:elseif={error}>
        <c-error-panel errors={error}></c-error-panel>
    </template>

    <!-- Main content -->
    <template lwc:else>
        <!-- Content here -->
    </template>
</template>
```

**Important:** Use `lwc:if`, `lwc:elseif`, `lwc:else` — NOT the deprecated `if:true`/`if:false` directives.

### LWC CSS Conventions

```css
/* Use SLDS design tokens via custom properties */
:host {
    display: block;
}

/* Use SLDS spacing tokens */
.card-container {
    padding: var(--lwc-spacingMedium, 1rem);
    margin-bottom: var(--lwc-spacingSmall, 0.75rem);
}

/* Responsive design — required for mobile optimization */
@media (max-width: 768px) {
    .grid-container {
        flex-direction: column;
    }
}

/* NEVER use !important */
/* NEVER use element selectors (they don't cross shadow DOM) */
/* NEVER reference SLDS classes directly — use slds classes in the HTML template */
```

### Apex Conventions

```java
/**
 * Controller for device/asset-related operations in the Experience Cloud portal.
 * All methods enforce FLS and CRUD via WITH SECURITY_ENFORCED.
 */
public with sharing class AssetController {

    /**
     * Retrieves assets (installed devices) for the current portal user's account.
     * Used by: deviceOverviewCard, installedProductList
     */
    @AuraEnabled(cacheable=true)
    public static List<Asset> getAccountAssets(Id accountId) {
        return [
            SELECT Id, Name, SerialNumber, Product2.Name, Status,
                   InstallDate, Warranty_Expiry__c
            FROM Asset
            WHERE AccountId = :accountId
            WITH SECURITY_ENFORCED
            ORDER BY InstallDate DESC
        ];
    }

    /**
     * Creates a new support case linked to a device.
     * Used by: supportCaseForm, caseWizard
     * NOTE: Not cacheable — performs DML
     */
    @AuraEnabled
    public static Id createSupportCase(Id assetId, String subject, String description, String priority) {
        Case c = new Case(
            AssetId = assetId,
            Subject = subject,
            Description = description,
            Priority = priority,
            Origin = 'Portal',
            Status = 'New'
        );
        insert c;
        return c.Id;
    }
}
```

**Apex rules:**
- Always use `with sharing` for portal-facing controllers
- Always use `WITH SECURITY_ENFORCED` in SOQL
- `@AuraEnabled(cacheable=true)` for read-only wire-compatible methods
- `@AuraEnabled` (no cacheable) for DML methods
- Bulkify everything — no SOQL or DML in loops
- Document which LWC components consume each method
- Test classes: minimum 85% coverage, use `@isTest`, `Test.startTest()`/`Test.stopTest()`

### Meta XML for Experience Cloud Components

Every LWC that appears in the portal needs an Experience Cloud target:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/Tooling">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
        <target>lightningCommunity__Page</target>
        <target>lightningCommunity__Default</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightningCommunity__Default">
            <property name="accountId" type="String" label="Account ID"
                      description="The account ID to display assets for" />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

**Key targets:**
- `lightningCommunity__Page` — Appears in Experience Builder page layouts
- `lightningCommunity__Default` — Appears in Experience Builder with property panel for configuration

---

## Data Model

### Standard Objects (Configure, Don't Create)

| Object | Role in Portal | Key Fields to Add |
|--------|---------------|-------------------|
| Account | Hospital / Blood Center / Lab | `Type` (picklist: Hospital, Blood Center, Cell Therapy Lab), `Region__c` |
| Contact | Portal user (biomed engineer, lab manager) | `Portal_Role__c` (picklist: Biomedical Engineer, Lab Manager, Admin), `Department__c` |
| Asset | Installed Terumo device | `Serial_Number__c` (if not using standard), `Model__c`, `Warranty_Expiry__c`, `Device_Category__c` (picklist: Blood Collection, Apheresis, Cell Therapy, Transfusion), `Error_Code__c` |
| Case | Support request | `Asset__c` (lookup to Asset), `Error_Code__c`, `Device_Category__c` (formula from Asset), `Resolution_Notes__c` |
| Knowledge (Article) | Troubleshooting guides | `Device_Category__c`, enable for Experience Cloud |

### Custom Objects

| Object | Purpose | Key Fields |
|--------|---------|------------|
| Work_Order__c | Field service visit (simulating ServiceMax) | `Case__c` (lookup), `Asset__c` (lookup), `Technician_Name__c`, `Scheduled_Date__c`, `Completed_Date__c`, `Status__c` (New/Scheduled/In Progress/Completed), `Parts_Required__c` (long text), `Service_Notes__c` |
| Service_Contract__c | Warranty / SLA tracking | `Account__c` (lookup), `Start_Date__c`, `End_Date__c`, `Coverage_Level__c` (picklist: Basic, Premium, Enterprise), `SLA_Response_Hours__c` |

### Sample Data Volume

Load enough data to make the portal feel real:
- 5 Accounts (mix of Hospital, Blood Center, Lab)
- 15 Contacts (3 per account, different roles)
- 30 Assets (6 per account, mix of device categories)
- 20 Cases (varying statuses: New, In Progress, Escalated, Closed)
- 10 Work Orders (linked to cases)
- 5 Service Contracts
- 10 Knowledge Articles (troubleshooting guides by device category)

---

## Component Architecture

### Component Hierarchy

```
Experience Cloud Portal
├── Home Page
│   ├── dashboardSummaryCards (parent)
│   │   ├── summaryCard (child) — "Open Cases"
│   │   ├── summaryCard (child) — "Upcoming Service Visits"
│   │   └── summaryCard (child) — "Active Devices"
│   ├── recentActivityFeed
│   └── quickActionPanel
│       ├── "Report Issue" → navigates to caseWizard
│       └── "Ask AI Assistant" → navigates to AI page
│
├── Assets Page
│   ├── assetList (search + filter + card layout)
│   └── assetDetailContainer (parent — activated on asset select)
│       ├── assetDetailsPanel (child — receives @api assetId)
│       ├── serviceHistoryTimeline (child — receives @api assetId)
│       └── relatedCasesList (child — receives @api assetId)
│
├── Support Cases Page
│   ├── caseWizard (multi-step: Select Asset → Describe Issue → Attach Files → Review & Submit)
│   ├── caseList (filterable by status, device category)
│   └── caseDetailView (tabs: Overview, Comments, Timeline)
│
├── AI Assistant Page
│   ├── aiChatAssistant (chat UI, context-aware)
│   └── suggestedActionsPanel (CTA cards)
│
└── Shared / Utility Components
    ├── statusBadge (reusable status pill — Open, Closed, In Progress, etc.)
    ├── emptyState (icon + message + optional CTA)
    ├── loadingSkeleton (shimmer placeholder, variants: card, list, detail)
    ├── errorPanel (displays reduced errors)
    └── errorUtils (JS module — reduceErrors utility function)
```

### Communication Patterns by Component

| Pattern | Where Used | Implementation |
|---------|-----------|----------------|
| **Parent → Child (@api)** | `assetDetailContainer` → `assetDetailsPanel` | Parent passes `assetId` down; child queries its own data using `@wire` with reactive `$assetId` |
| **Child → Parent (CustomEvent)** | `assetList` → page handler | Child fires `onassetselect` with `detail: { assetId }` |
| **Sibling (via parent)** | `assetList` ↔ `assetDetailContainer` | Parent page holds `selectedAssetId` state, passes to both |
| **Cross-page (LMS)** | `quickActionPanel` → `caseWizard` | `NavigationMixin` for page navigation; Lightning Message Service if pre-populating data across pages |
| **Refresh** | `caseWizard` submit → `caseList` | After case creation, dispatch event; parent calls `refreshApex` on wired data or child's `@api refresh()` |

### Priority Build Order

Build in this order — each phase is independently demoable:

**Phase 1 — Foundation (Days 1-3):**
1. `errorUtils` (shared JS module)
2. `statusBadge`, `emptyState`, `loadingSkeleton`, `errorPanel` (utility components)
3. `AssetController.cls` and `CaseController.cls` (Apex controllers)

**Phase 2 — Assets Page (Days 4-6):**
4. `assetList` (search, filter, card-based layout)
5. `assetDetailsPanel`
6. `serviceHistoryTimeline`
7. `relatedCasesList`
8. `assetDetailContainer` (parent wiring all children)

**Phase 3 — Case Wizard (Days 7-9):**
9. `caseWizard` (multi-step form — THIS IS YOUR STAR COMPONENT)
10. `caseList` (filterable list with status badges)
11. `caseDetailView` (tabbed detail page)

**Phase 4 — Dashboard (Days 10-11):**
12. `summaryCard` (reusable metric card)
13. `dashboardSummaryCards` (parent composing 3 summary cards)
14. `recentActivityFeed`
15. `quickActionPanel`

**Phase 5 — AI & Polish (Days 12-14):**
16. `aiChatAssistant` (mock chat UI — Agentforce concept)
17. `suggestedActionsPanel`
18. Mobile responsiveness pass on all components
19. Jest tests for key components

---

## Experience Cloud Configuration Rules

### Portal Setup

- **Template:** Customer Service
- **Authentication:** Username/Password for portal users (Contact-based)
- **Guest Access:** Disabled — all pages require login
- **URL:** Set a clean custom URL path: `/meddevice-hub` or similar

### Sharing & Security

- **Sharing Sets:** Create a sharing set that grants portal users access to Assets, Cases, and Work Orders related to their Account
- **Profile:** Clone "Customer Community Plus Login User" profile, customize object permissions
- **Permission Set:** Create `MedDevice_Portal_User` permission set for field-level access
- **Sharing Rule:** Portal users see only records belonging to their Account (default: Private for Assets, Cases, Work Orders)

### Experience Builder Configuration

- **Theme:** Use the `Build Your Own (LWR)` template for maximum LWC control if available, otherwise `Customer Service`
- **Navigation:** Top navigation with: Home, My Devices, Support Cases, Knowledge, AI Assistant
- **Branding:** Use a clean, professional color scheme. Suggest Terumo-inspired blues (#0066B3) and whites
- **Head Markup:** Add viewport meta tag if not present for mobile responsiveness

### Guest vs. Authenticated Pages

All pages in this project are **authenticated only**. No guest access pages. The portal user context (`$User`, `$CurrentUser`) determines which Account's data is visible.

---

## @wire vs. Imperative Apex — Decision Guide

Use this when generating component code:

| Scenario | Use | Why |
|----------|-----|-----|
| Loading a list of assets on page load | `@wire` | Reactive, cached, re-fetches when parameters change |
| Loading case details when user clicks a case | `@wire` with reactive `$caseId` | Parameter changes trigger re-fetch automatically |
| Submitting a new case (DML) | Imperative | Can't use @wire for DML operations |
| Refreshing data after a create/update | `refreshApex(this.wiredResult)` | Invalidates the wire cache and re-fetches |
| Conditional data load (only when user clicks a tab) | Imperative | Don't want automatic fetching; control when the call happens |
| Fetching data that depends on multiple user inputs | Imperative | Complex parameter assembly before calling |

### @wire Patterns

```javascript
// Pattern 1: Wire to property (simple, for templates)
@wire(getAssets, { accountId: '$accountId' })
assets;
// Access: this.assets.data, this.assets.error

// Pattern 2: Wire to function (when you need to transform data or handle errors)
@wire(getAssets, { accountId: '$accountId' })
wiredAssets(result) {
    this._wiredAssetsResult = result; // Store for refreshApex
    const { data, error } = result;
    if (data) {
        this.assets = data.map(a => ({
            ...a,
            warrantyClass: this._getWarrantyClass(a.Warranty_Expiry__c)
        }));
    } else if (error) {
        this.error = reduceErrors(error);
    }
}

// Refreshing after DML
async handleSubmit() {
    try {
        await createCase({ /* params */ });
        await refreshApex(this._wiredAssetsResult);
        this.dispatchEvent(new CustomEvent('casecreated'));
    } catch (error) {
        this.error = reduceErrors(error);
    }
}
```

### @track — When You Actually Need It

You almost never need `@track` in modern LWC. All fields are reactive by default. The only time you need it is for **deep object mutation detection** — and even then, prefer immutable reassignment:

```javascript
// DON'T DO THIS (mutation — won't trigger re-render without @track)
this.filters.status = 'Open';

// DO THIS (reassignment — triggers re-render, no @track needed)
this.filters = { ...this.filters, status: 'Open' };

// DO THIS for arrays
this.items = [...this.items, newItem];
```

---

## Agentforce — Implementation Approach

For the demo, build the **UI layer** for an Agentforce-style chat. The backend can be mocked.

### Chat Component Architecture

```
aiChatAssistant (parent)
├── messageList (child — renders conversation)
│   └── chatMessage (child — individual message bubble)
├── chatInput (child — text input + send button)
└── suggestedActionsPanel (sibling — context-aware CTAs)
```

### Mock Backend Pattern

```java
@AuraEnabled
public static String getAgentResponse(String userMessage, Id contextAssetId) {
    // In production this would call Agentforce API
    // For demo, return context-aware mock responses
    if (userMessage.containsIgnoreCase('status')) {
        Asset a = [SELECT Name, Status FROM Asset WHERE Id = :contextAssetId LIMIT 1];
        return 'Your device ' + a.Name + ' is currently: ' + a.Status + '. Is there anything else I can help with?';
    }
    if (userMessage.containsIgnoreCase('case') || userMessage.containsIgnoreCase('issue')) {
        return 'I can help you create a support case. Would you like me to start a new case for this device?';
    }
    return 'I can help you check device status, create support cases, or find troubleshooting articles. What would you like to do?';
}
```

**Interview talking point:** "In production, this Apex mock would be replaced by an Agentforce agent configured with Topics for device support, case management, and knowledge search. The Actions would map to the same Apex methods my LWC components already use. The UI layer I built is agent-agnostic — it works whether the backend is a mock, Agentforce, or any other AI service."

---

## Testing Standards

### Jest Tests — What to Test

For each LWC, test at minimum:
1. **Renders correctly** with mock @wire data
2. **Handles empty state** when no data is returned
3. **Handles error state** when wire returns an error
4. **Event dispatch** — verify CustomEvents fire with correct detail
5. **User interaction** — click handlers, form validation

### Jest Test Template

```javascript
import { createElement } from 'lwc';
import AssetList from 'c/assetList';
import getAccountAssets from '@salesforce/apex/AssetController.getAccountAssets';

// Mock Apex wire adapter
jest.mock(
    '@salesforce/apex/AssetController.getAccountAssets',
    () => ({ default: jest.fn() }),
    { virtual: true }
);

const MOCK_ASSETS = [
    { Id: '001', Name: 'Trima Accel', SerialNumber: 'TR-2024-001', Status: 'Active' },
    { Id: '002', Name: 'Reveos', SerialNumber: 'RV-2024-002', Status: 'Active' }
];

describe('c-asset-list', () => {
    afterEach(() => { while (document.body.firstChild) { document.body.removeChild(document.body.firstChild); } });

    it('renders asset cards when data is returned', async () => {
        getAccountAssets.mockResolvedValue(MOCK_ASSETS);
        const element = createElement('c-asset-list', { is: AssetList });
        element.accountId = '001ABC';
        document.body.appendChild(element);

        await Promise.resolve(); // Wait for wire
        const cards = element.shadowRoot.querySelectorAll('.asset-card');
        expect(cards.length).toBe(2);
    });

    it('renders empty state when no assets', async () => {
        getAccountAssets.mockResolvedValue([]);
        const element = createElement('c-asset-list', { is: AssetList });
        element.accountId = '001ABC';
        document.body.appendChild(element);

        await Promise.resolve();
        const emptyState = element.shadowRoot.querySelector('c-empty-state');
        expect(emptyState).not.toBeNull();
    });

    it('fires assetselect event on card click', async () => {
        getAccountAssets.mockResolvedValue(MOCK_ASSETS);
        const handler = jest.fn();
        const element = createElement('c-asset-list', { is: AssetList });
        element.accountId = '001ABC';
        element.addEventListener('assetselect', handler);
        document.body.appendChild(element);

        await Promise.resolve();
        const card = element.shadowRoot.querySelector('.asset-card');
        card.click();
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.assetId).toBe('001');
    });
});
```

### Apex Test Template

```java
@isTest
private class AssetControllerTest {

    @TestSetup
    static void setup() {
        Account acc = new Account(Name = 'Denver General Hospital', Type = 'Hospital');
        insert acc;

        Contact con = new Contact(LastName = 'Miller', AccountId = acc.Id);
        insert con;

        List<Asset> assets = new List<Asset>();
        for (Integer i = 0; i < 5; i++) {
            assets.add(new Asset(
                Name = 'Trima Accel ' + i,
                AccountId = acc.Id,
                SerialNumber = 'TR-2024-' + String.valueOf(i).leftPad(3, '0'),
                Status = 'Active'
            ));
        }
        insert assets;
    }

    @isTest
    static void testGetAccountAssets() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Test.startTest();
        List<Asset> results = AssetController.getAccountAssets(acc.Id);
        Test.stopTest();
        System.assertEquals(5, results.size(), 'Should return 5 assets');
    }

    @isTest
    static void testCreateSupportCase() {
        Asset a = [SELECT Id FROM Asset LIMIT 1];
        Test.startTest();
        Id caseId = AssetController.createSupportCase(
            a.Id, 'Device Error', 'Error code E-4521', 'High'
        );
        Test.stopTest();
        Case c = [SELECT Subject, Status, Origin FROM Case WHERE Id = :caseId];
        System.assertEquals('Device Error', c.Subject);
        System.assertEquals('New', c.Status);
        System.assertEquals('Portal', c.Origin);
    }
}
```

---

## File Structure

```
force-app/
└── main/
    └── default/
        ├── classes/
        │   ├── AssetController.cls
        │   ├── AssetController.cls-meta.xml
        │   ├── AssetControllerTest.cls
        │   ├── CaseController.cls
        │   ├── CaseController.cls-meta.xml
        │   ├── CaseControllerTest.cls
        │   ├── WorkOrderController.cls
        │   ├── WorkOrderController.cls-meta.xml
        │   ├── WorkOrderControllerTest.cls
        │   ├── KnowledgeController.cls
        │   ├── KnowledgeController.cls-meta.xml
        │   ├── KnowledgeControllerTest.cls
        │   ├── AgentResponseController.cls
        │   ├── AgentResponseController.cls-meta.xml
        │   └── AgentResponseControllerTest.cls
        ├── lwc/
        │   ├── errorUtils/              (shared JS utility module — no HTML)
        │   ├── statusBadge/             (reusable status pill)
        │   ├── emptyState/              (empty state with icon + CTA)
        │   ├── loadingSkeleton/         (shimmer loading placeholder)
        │   ├── errorPanel/              (error display)
        │   ├── summaryCard/             (metric card for dashboard)
        │   ├── dashboardSummaryCards/   (parent — composes 3 summary cards)
        │   ├── recentActivityFeed/      (timeline of recent events)
        │   ├── quickActionPanel/        (CTA buttons for common actions)
        │   ├── assetList/               (searchable, filterable asset grid)
        │   ├── assetDetailsPanel/       (device detail view)
        │   ├── serviceHistoryTimeline/  (service visit history)
        │   ├── relatedCasesList/        (cases linked to an asset)
        │   ├── assetDetailContainer/    (PARENT — orchestrates asset detail children)
        │   ├── caseWizard/              (STAR COMPONENT — multi-step case creation)
        │   ├── caseList/                (filterable case list)
        │   ├── caseDetailView/          (tabbed case detail)
        │   ├── aiChatAssistant/         (chat UI for Agentforce concept)
        │   ├── chatMessage/             (individual chat bubble)
        │   └── suggestedActionsPanel/   (context-aware action cards)
        ├── objects/                      (custom fields and objects)
        ├── permissionsets/
        │   └── MedDevice_Portal_User.permissionset-meta.xml
        └── experiences/                  (Experience Cloud site metadata)
```

---

## Key Reminders for Code Generation

1. **Every component needs 3 states:** Loading, Empty, Error. Use the shared utility components.
2. **Never use `if:true`/`if:false`.** Always use `lwc:if`/`lwc:elseif`/`lwc:else`.
3. **All SOQL must use `WITH SECURITY_ENFORCED`.**
4. **All controllers must be `with sharing`.**
5. **No SOQL or DML inside loops.**
6. **Events are lowercase, no hyphens:** `assetselect`, not `asset-select` or `AssetSelect`.
7. **Prefer immutable state updates** over mutation. Use spread operator.
8. **All components exposed to Experience Cloud** need `lightningCommunity__Page` and `lightningCommunity__Default` targets.
9. **Mobile-first CSS.** Use SLDS grid utilities (`slds-size_1-of-1 slds-medium-size_1-of-2`) and add `@media` breakpoints.
10. **Document every Apex method** with which LWC consumes it.
11. **Test coverage target: 85%+** for Apex, meaningful tests for LWC Jest.
12. **Use `lightning-record-*` base components** where they fit (they handle FLS automatically). Fall back to custom Apex only when you need custom queries or DML logic.
