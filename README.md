# MedDevice Client Hub

A customer-facing Experience Cloud portal for medical device support, built as a Salesforce Developer interview demo for the Terumo BCT Sr Salesforce Developer role.

Hospital biomedical engineers, blood bank managers, and lab technicians use this portal to manage their installed devices, submit service requests, track field service visits, and access self-service troubleshooting — all through a clean, mobile-responsive UI built with Lightning Web Components.

---

## Why This Project Exists

This project demonstrates:

- **Experience Cloud expertise** — portal configuration, sharing sets, audiences, authenticated page design
- **LWC architecture** — parent-child communication, @api/@wire patterns, proper event handling, reusable component design
- **UI/UX maturity** — loading states, empty states, error handling, mobile responsiveness, multi-step wizards
- **Salesforce best practices** — governor-aware Apex, security enforcement, bulkified patterns, Jest + Apex testing
- **Agentforce readiness** — an AI chat interface demonstrating how virtual agents integrate into customer portals
- **ServiceMax awareness** — a data model that mirrors field service management concepts (assets, work orders, service contracts)

---

## Prerequisites

Before starting, make sure you have:

- [ ] **Salesforce Developer Edition org** — sign up free at [developer.salesforce.com](https://developer.salesforce.com/signup)
- [ ] **Salesforce CLI (sf)** installed — `npm install -g @salesforce/cli`
- [ ] **VS Code** with the [Salesforce Extension Pack](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode)
- [ ] **Node.js** (LTS version) for Jest testing
- [ ] **Git** for version control

---

## Step 1: Project Scaffolding

Create the SFDX project and connect to your dev org:

```bash
# Create the project
sf project generate --name meddevice-client-hub
cd meddevice-client-hub

# Authorize your dev org
sf org login web --alias meddevice-dev --set-default

# Verify connection
sf org display --target-org meddevice-dev
```

Place the `CLAUDE.md` file in the project root alongside this README. Claude Code will use it as context for generating components.

Initialize Git:

```bash
git init
git add .
git commit -m "Initial project scaffolding"
```

---

## Step 2: Enable Experience Cloud in Your Dev Org

This must be done manually in the browser — it can't be automated via CLI.

1. **Open your org:** `sf org open --target-org meddevice-dev`
2. **Go to Setup → Digital Experiences → Settings**
3. **Check "Enable Digital Experiences"**
4. **Choose a domain name** (e.g., `sampson-meddevice`) — this becomes `sampson-meddevice.my.site.com`
5. **Click Save**

Then create the site:

1. **Go to Setup → Digital Experiences → All Sites**
2. **Click "New"**
3. **Choose the "Customer Service" template** (best starting point for a support portal)
4. **Name it:** `MedDevice Client Hub`
5. **URL path:** `hub` (will become `sampson-meddevice.my.site.com/hub`)
6. **Click "Create"**

Don't publish yet — we'll configure it after building components.

---

## Step 3: Create the Data Model

### Custom Fields on Standard Objects

These need to be created in Setup or via metadata files. Create them manually first, then pull the metadata:

**On Account:**
- `Region__c` (Text, 50) — Geographic region of the facility

**On Asset:**
- `Device_Category__c` (Picklist: Blood Collection, Apheresis, Cell Therapy, Transfusion) — Type of medical device
- `Warranty_Expiry__c` (Date) — When the device warranty expires
- `Error_Code__c` (Text, 20) — Last known error code

**On Case:**
- `Asset__c` (Lookup to Asset) — The device this case is about
- `Error_Code__c` (Text, 20) — Error code reported by customer
- `Resolution_Notes__c` (Long Text Area, 5000) — How the issue was resolved

### Custom Objects

**Work_Order__c:**

| Field | Type | Description |
|-------|------|-------------|
| Name | Auto Number (WO-{0000}) | Work order number |
| Case__c | Lookup(Case) | Related support case |
| Asset__c | Lookup(Asset) | Device being serviced |
| Technician_Name__c | Text(100) | Assigned field technician |
| Scheduled_Date__c | Date | When the visit is scheduled |
| Completed_Date__c | Date | When service was completed |
| Status__c | Picklist | New, Scheduled, In Progress, Completed, Cancelled |
| Parts_Required__c | Long Text Area(2000) | Parts needed for service |
| Service_Notes__c | Long Text Area(5000) | Technician notes |

**Service_Contract__c:**

| Field | Type | Description |
|-------|------|-------------|
| Name | Text(80) | Contract name |
| Account__c | Lookup(Account) | Customer account |
| Start_Date__c | Date | Contract start |
| End_Date__c | Date | Contract end |
| Coverage_Level__c | Picklist | Basic, Premium, Enterprise |
| SLA_Response_Hours__c | Number(3,0) | Guaranteed response time in hours |

### Pull Metadata After Manual Creation

After creating objects and fields in Setup:

```bash
# Pull the metadata into your project
sf project retrieve start --metadata CustomObject:Work_Order__c,CustomObject:Service_Contract__c
sf project retrieve start --metadata CustomField:Account.Region__c,CustomField:Asset.Device_Category__c,CustomField:Asset.Warranty_Expiry__c,CustomField:Asset.Error_Code__c
sf project retrieve start --metadata CustomField:Case.Asset__c,CustomField:Case.Error_Code__c,CustomField:Case.Resolution_Notes__c
```

---

## Step 4: Enable Knowledge (for Self-Service Articles)

1. **Setup → Knowledge Settings → Enable Salesforce Knowledge**
2. Create a Record Type for articles: `Device_Troubleshooting`
3. Add custom fields to the article type:
   - `Device_Category__c` (Picklist — same values as Asset.Device_Category__c)
   - `Steps__c` (Rich Text Area)
4. **Setup → Digital Experiences → [Your Site] → Administration → Preferences**
   - Enable Knowledge in the portal

---

## Step 5: Configure Portal Users

### Create a Portal-Enabled Profile

1. **Setup → Profiles → Clone "Customer Community Plus Login User"**
2. Name it: `MedDevice Portal User`
3. Grant Read access to: Account, Contact, Asset, Case, Work_Order__c, Service_Contract__c, Knowledge
4. Grant Create/Edit on Case (so portal users can submit cases)

### Create a Permission Set

1. **Setup → Permission Sets → New**
2. Name: `MedDevice_Portal_User`
3. Grant field-level access to all custom fields created above
4. Grant Read access to Knowledge articles

### Set Up Sharing

1. **Setup → Sharing Settings**
   - Set Asset OWD to **Private**
   - Set Work_Order__c OWD to **Private**
   - Set Service_Contract__c OWD to **Private**

2. **Setup → Digital Experiences → [Your Site] → Administration → Sharing Sets**
   - Create sharing sets so portal users can access records where `Account` matches their Contact's Account

### Create Test Portal Users

1. Create a Contact under one of your test Accounts
2. **Setup → Users → New User**
   - Choose the portal profile
   - Associate with the Contact
   - Assign the permission set
3. Repeat for 2-3 test users across different Accounts

---

## Step 6: Load Sample Data

Create an Apex script to load sample data. Run it via Anonymous Apex in VS Code or Developer Console:

```java
// Run in Execute Anonymous
// Creates sample Accounts, Contacts, Assets, Cases, Work Orders

// Accounts
List<Account> accounts = new List<Account>{
    new Account(Name = 'Denver General Hospital', Type = 'Hospital'),
    new Account(Name = 'Colorado Blood Center', Type = 'Blood Center'),
    new Account(Name = 'Rocky Mountain Cell Therapy Lab', Type = 'Cell Therapy Lab'),
    new Account(Name = 'Front Range Medical Center', Type = 'Hospital'),
    new Account(Name = 'Pikes Peak Blood Services', Type = 'Blood Center')
};
insert accounts;

// Assets — Terumo-style medical devices
List<Asset> assets = new List<Asset>();
String[] deviceNames = new String[]{
    'Trima Accel', 'Reveos', 'Orbisac', 'Terumo Tsukuba',
    'COBE Spectra', 'Spectra Optia'
};
String[] categories = new String[]{
    'Apheresis', 'Blood Collection', 'Blood Collection', 'Cell Therapy',
    'Apheresis', 'Apheresis'
};

for (Account acc : accounts) {
    for (Integer i = 0; i < 6; i++) {
        assets.add(new Asset(
            Name = deviceNames[i] + ' - ' + acc.Name.left(10),
            AccountId = acc.Id,
            SerialNumber = 'TER-' + String.valueOf(Math.round(Math.random() * 90000 + 10000)),
            Status = (Math.random() > 0.2) ? 'Active' : 'Under Maintenance',
            InstallDate = Date.today().addDays(-Integer.valueOf(Math.random() * 365 * 3)),
            Device_Category__c = categories[i],
            Warranty_Expiry__c = Date.today().addDays(Integer.valueOf(Math.random() * 730))
        ));
    }
}
insert assets;

// Cases
List<Case> cases = new List<Case>();
String[] statuses = new String[]{ 'New', 'New', 'In Progress', 'In Progress', 'Escalated', 'Closed' };
String[] subjects = new String[]{
    'Error code E-4521 on startup',
    'Calibration drift detected',
    'Preventive maintenance overdue',
    'Display panel unresponsive',
    'Fluid leak near centrifuge',
    'Routine software update request'
};

for (Integer i = 0; i < 20; i++) {
    Integer assetIndex = Integer.valueOf(Math.random() * assets.size());
    cases.add(new Case(
        Subject = subjects[Math.mod(i, subjects.size())],
        Description = 'Reported by hospital biomedical engineering team.',
        Status = statuses[Math.mod(i, statuses.size())],
        Priority = (Math.random() > 0.6) ? 'High' : 'Medium',
        Origin = 'Portal',
        AccountId = assets[assetIndex].AccountId,
        AssetId = assets[assetIndex].Id
    ));
}
insert cases;

System.debug('Sample data loaded: ' + accounts.size() + ' accounts, ' + assets.size() + ' assets, ' + cases.size() + ' cases');
```

After running this, create Work Orders and Service Contracts manually or with a similar script. The exact data matters less than having enough records to make the portal feel populated.

---

## Step 7: Build Components

Follow the priority build order defined in `CLAUDE.md`. Here's the phased approach:

### Phase 1: Foundation (Utility Components + Apex)

Start with the building blocks everything else depends on:

```bash
# Generate utility components
sf lightning generate component --name errorUtils --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name statusBadge --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name emptyState --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name loadingSkeleton --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name errorPanel --type lwc --output-dir force-app/main/default/lwc

# Generate Apex controllers
sf apex generate class --name AssetController --output-dir force-app/main/default/classes
sf apex generate class --name CaseController --output-dir force-app/main/default/classes
sf apex generate class --name WorkOrderController --output-dir force-app/main/default/classes
sf apex generate class --name KnowledgeController --output-dir force-app/main/default/classes
```

**Deploy and test:**

```bash
sf project deploy start --source-dir force-app --target-org meddevice-dev
sf apex run test --target-org meddevice-dev --wait 10
```

### Phase 2: Assets Page

This is your **parent-child architecture showcase**. Build the children first, then the parent container:

```bash
sf lightning generate component --name assetList --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name assetDetailsPanel --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name serviceHistoryTimeline --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name relatedCasesList --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name assetDetailContainer --type lwc --output-dir force-app/main/default/lwc
```

After deploying, add these to the Experience Cloud site:
1. Open Experience Builder: **Setup → Digital Experiences → All Sites → Builder (next to your site)**
2. Create a page: "My Devices"
3. Drag your `assetList` and `assetDetailContainer` components onto the page
4. Configure any exposed properties via the property panel

### Phase 3: Case Wizard (Star Component)

This is the component that carries your demo:

```bash
sf lightning generate component --name caseWizard --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name caseList --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name caseDetailView --type lwc --output-dir force-app/main/default/lwc
```

The `caseWizard` should be a multi-step form:
1. **Select Asset** — searchable dropdown of the user's devices
2. **Describe Issue** — subject, description, priority, error code
3. **Attach Files** — file upload component
4. **Review & Submit** — summary of all inputs before submission

### Phase 4: Dashboard

```bash
sf lightning generate component --name summaryCard --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name dashboardSummaryCards --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name recentActivityFeed --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name quickActionPanel --type lwc --output-dir force-app/main/default/lwc
```

### Phase 5: AI Assistant + Polish

```bash
sf lightning generate component --name aiChatAssistant --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name chatMessage --type lwc --output-dir force-app/main/default/lwc
sf lightning generate component --name suggestedActionsPanel --type lwc --output-dir force-app/main/default/lwc

# Apex for mock AI responses
sf apex generate class --name AgentResponseController --output-dir force-app/main/default/classes
```

---

## Step 8: Configure the Experience Cloud Site

Once components are deployed, configure the portal in Experience Builder:

### Navigation

Set up top navigation with these pages:
1. **Home** — Dashboard with summary cards, activity feed, quick actions
2. **My Devices** — Asset list + asset detail container
3. **Support Cases** — Case list + case wizard (accessible via "New Case" button)
4. **Knowledge** — Article search (if time permits)
5. **AI Assistant** — Chat interface

### Branding

1. Open **Experience Builder → Theme**
2. Set primary color: `#0066B3` (Terumo-inspired blue)
3. Set header background: white with the primary color for accents
4. Upload a simple logo (or use a placeholder)
5. Set font: Use the default SLDS font stack

### Publish

1. In Experience Builder, click **Preview** to test
2. Log in as a test portal user to verify data visibility and sharing
3. When satisfied, click **Publish**
4. Your portal is live at: `[your-domain].my.site.com/hub`

---

## Step 9: Write Tests

### Jest Tests

```bash
# Install Jest dependencies (run from project root)
sf lightning generate component --name __tests__ --type lwc  # Skip this — just ensure node_modules exist
npm install
npm install @salesforce/sfdx-lwc-jest --save-dev
```

Add to `package.json`:

```json
{
  "scripts": {
    "test:unit": "sfdx-lwc-jest",
    "test:unit:watch": "sfdx-lwc-jest --watch",
    "test:unit:coverage": "sfdx-lwc-jest --coverage"
  }
}
```

Run tests:

```bash
npm run test:unit
npm run test:unit:coverage
```

Priority components to test:
1. `caseWizard` — step navigation, validation, event dispatch
2. `assetDetailContainer` — parent-child data flow
3. `assetList` — search filtering, asset selection event
4. `statusBadge` — renders correct variant for each status

### Apex Tests

```bash
# Run all tests
sf apex run test --target-org meddevice-dev --code-coverage --result-format human --wait 10

# Run a specific test class
sf apex run test --target-org meddevice-dev --class-names AssetControllerTest --wait 10
```

---

## Step 10: Prepare Your Demo

### Demo Script (5 minutes)

1. **Open the portal** (30 sec) — Show the login experience, explain the user persona: "This is Sarah, a biomedical engineer at Denver General Hospital."

2. **Dashboard** (45 sec) — Walk through summary cards: "Sarah immediately sees she has 2 open cases, 1 upcoming service visit, and 6 active devices. The quick action panel gives her one-click access to report an issue."

3. **My Devices** (60 sec) — Show the asset list with search and filters. Click into a device: "This is the parent-child architecture — `assetDetailContainer` receives the asset ID and passes it down to three children: details panel, service history timeline, and related cases. Data flows down via @api, events bubble up via CustomEvent."

4. **Create a Case** (90 sec) — Walk through the case wizard step by step: "This multi-step wizard validates at each step. Step 1 lets Sarah select the device. Step 2 captures the issue. Step 3 handles file uploads. Step 4 is a review screen before submission. On submit, the Apex controller creates the case and we refresh the related data using refreshApex."

5. **AI Assistant** (45 sec) — Show the chat interface: "This is designed for Agentforce integration. The UI is context-aware — it knows which device Sarah was just viewing. In production, this would be backed by an Agentforce agent with Topics for device support, case creation, and knowledge search."

6. **Technical Highlights** (30 sec) — "All Apex uses `with sharing` and `WITH SECURITY_ENFORCED`. Jest tests cover the key components. The portal uses sharing sets so each customer only sees their own data. Components are mobile-responsive using SLDS grid utilities."

### What to Have Ready

- [ ] Portal URL bookmarked
- [ ] Test portal user credentials ready
- [ ] Dev console or VS Code open to show code if asked
- [ ] GitHub repo with clean commit history
- [ ] This README open for reference

---

## Git Strategy

Keep commits clean and purposeful:

```
feat: add utility components (statusBadge, emptyState, loadingSkeleton)
feat: add AssetController with security enforcement
feat: add asset list with search and filter
feat: add asset detail container with parent-child architecture
feat: add case wizard multi-step form
feat: add dashboard summary cards
feat: add AI chat assistant UI
feat: add Experience Cloud site configuration
test: add Jest tests for asset list and case wizard
test: add Apex tests for all controllers
docs: add project README and CLAUDE.md
```

Push to your GitHub (`github.com/smill0791`) and optionally link from your dev site (`sampson-dev.vercel.app`).

---

## Troubleshooting

**"Component not showing in Experience Builder"**
- Verify `isExposed: true` in the `.js-meta.xml`
- Verify targets include `lightningCommunity__Page` and `lightningCommunity__Default`
- Deploy the component, then refresh Experience Builder (hard refresh)

**"Access denied" errors for portal users**
- Check the sharing set configuration
- Verify the portal profile has object-level Read access
- Verify the permission set grants field-level access
- Check that the portal user's Contact is linked to the correct Account

**"@wire not returning data"**
- Verify the Apex method has `@AuraEnabled(cacheable=true)`
- Check that reactive parameters use the `$` prefix: `'$accountId'`
- Ensure the parameter property has a value (not undefined) before the wire fires

**"Jest tests failing"**
- Run `npm install` to ensure dependencies are current
- Mock all `@salesforce/*` imports
- Use `await Promise.resolve()` (or multiple) to wait for async wire resolution

**"Experience Cloud site not loading"**
- Verify the site is Published (not just saved)
- Check that the portal user's profile is added to the site's member list
- Verify the site URL is active in Setup → Digital Experiences → All Sites
