/**
 * Sample data loader for the MedDevice Client Hub portal.
 *
 * Run with:
 *   sf apex run --file scripts/apex/loadSampleData.apex --target-org meddevice-dev
 *
 * Creates a realistic, account-scoped data set: Accounts, Contacts, Assets,
 * Cases, Work Orders, and Service Contracts. Idempotent-ish — re-running adds
 * more records, so use a fresh org or delete prior demo data if needed.
 */

// ---------- Accounts ----------
List<Account> accounts = new List<Account>{
    new Account(Name = 'Denver General Hospital', Type = 'Hospital', Region__c = 'Mountain West'),
    new Account(Name = 'Colorado Blood Center', Type = 'Blood Center', Region__c = 'Mountain West'),
    new Account(Name = 'Rocky Mountain Cell Therapy Lab', Type = 'Cell Therapy Lab', Region__c = 'Mountain West'),
    new Account(Name = 'Front Range Medical Center', Type = 'Hospital', Region__c = 'Mountain West'),
    new Account(Name = 'Pikes Peak Blood Services', Type = 'Blood Center', Region__c = 'Mountain West')
};
insert accounts;

// ---------- Contacts (3 per account) ----------
String[] roles = new String[]{ 'Biomedical Engineer', 'Lab Manager', 'Admin' };
String[] firstNames = new String[]{ 'Sarah', 'James', 'Maria', 'David', 'Linda', 'Robert' };
List<Contact> contacts = new List<Contact>();
Integer fnIdx = 0;
for (Account acc : accounts) {
    for (Integer i = 0; i < 3; i++) {
        contacts.add(new Contact(
            FirstName = firstNames[Math.mod(fnIdx++, firstNames.size())],
            LastName = acc.Name.substringBefore(' ') + ' Contact ' + i,
            AccountId = acc.Id,
            Portal_Role__c = roles[i],
            Department__c = (i == 0) ? 'Biomedical Engineering' : (i == 1) ? 'Laboratory' : 'Administration'
        ));
    }
}
insert contacts;

// ---------- Assets (6 per account) ----------
String[] deviceNames = new String[]{ 'Trima Accel', 'Reveos', 'Orbisac', 'Terumo Tsukuba', 'COBE Spectra', 'Spectra Optia' };
String[] categories = new String[]{ 'Apheresis', 'Blood Collection', 'Blood Collection', 'Cell Therapy', 'Apheresis', 'Apheresis' };
List<Asset> assets = new List<Asset>();
for (Account acc : accounts) {
    for (Integer i = 0; i < 6; i++) {
        assets.add(new Asset(
            Name = deviceNames[i] + ' - ' + acc.Name.left(10),
            AccountId = acc.Id,
            SerialNumber = 'TER-' + String.valueOf(Math.round(Math.random() * 90000 + 10000)),
            Status = (Math.random() > 0.2) ? 'Active' : 'Under Maintenance',
            InstallDate = Date.today().addDays(-Integer.valueOf(Math.random() * 365 * 3)),
            Device_Category__c = categories[i],
            Warranty_Expiry__c = Date.today().addDays(Integer.valueOf(Math.random() * 730) - 90)
        ));
    }
}
insert assets;

// ---------- Cases (20) ----------
String[] statuses = new String[]{ 'New', 'New', 'In Progress', 'In Progress', 'Escalated', 'Closed' };
String[] subjects = new String[]{
    'Error code E-4521 on startup',
    'Calibration drift detected',
    'Preventive maintenance overdue',
    'Display panel unresponsive',
    'Fluid leak near centrifuge',
    'Routine software update request'
};
String[] errorCodes = new String[]{ 'E-4521', 'E-1102', '', 'E-2087', 'E-3340', '' };
List<Case> cases = new List<Case>();
for (Integer i = 0; i < 20; i++) {
    Integer assetIndex = Integer.valueOf(Math.random() * assets.size());
    Integer sIdx = Math.mod(i, subjects.size());
    cases.add(new Case(
        Subject = subjects[sIdx],
        Description = 'Reported by the hospital biomedical engineering team.',
        Status = statuses[Math.mod(i, statuses.size())],
        Priority = (Math.random() > 0.6) ? 'High' : 'Medium',
        Origin = 'Portal',
        AccountId = assets[assetIndex].AccountId,
        AssetId = assets[assetIndex].Id,
        Error_Code__c = errorCodes[sIdx]
    ));
}
insert cases;

// ---------- Work Orders (10) ----------
String[] technicians = new String[]{ 'Alex Rivera', 'Jordan Kim', 'Priya Patel', 'Sam Lee', 'Chris Nguyen' };
String[] woStatuses = new String[]{ 'Scheduled', 'In Progress', 'Completed', 'New', 'Completed' };
List<Work_Order__c> workOrders = new List<Work_Order__c>();
for (Integer i = 0; i < 10; i++) {
    Case relatedCase = cases[Math.mod(i, cases.size())];
    String status = woStatuses[Math.mod(i, woStatuses.size())];
    Boolean done = status == 'Completed';
    workOrders.add(new Work_Order__c(
        Case__c = relatedCase.Id,
        Asset__c = relatedCase.AssetId,
        Technician_Name__c = technicians[Math.mod(i, technicians.size())],
        Status__c = status,
        Scheduled_Date__c = done ? Date.today().addDays(-(i + 5)) : Date.today().addDays(i + 2),
        Completed_Date__c = done ? Date.today().addDays(-(i + 4)) : null,
        Parts_Required__c = (Math.mod(i, 2) == 0) ? 'Replacement tubing set, pressure sensor' : 'None',
        Service_Notes__c = done ? 'Completed preventive maintenance and verified calibration.' : 'Awaiting scheduled visit.'
    ));
}
insert workOrders;

// ---------- Service Contracts (1 per account) ----------
String[] coverage = new String[]{ 'Basic', 'Premium', 'Enterprise' };
Integer[] slaHours = new Integer[]{ 48, 24, 8 };
List<Service_Contract__c> contracts = new List<Service_Contract__c>();
Integer cIdx = 0;
for (Account acc : accounts) {
    Integer level = Math.mod(cIdx++, coverage.size());
    contracts.add(new Service_Contract__c(
        Name = acc.Name + ' Service Agreement',
        Account__c = acc.Id,
        Start_Date__c = Date.today().addMonths(-6),
        End_Date__c = Date.today().addMonths(6),
        Coverage_Level__c = coverage[level],
        SLA_Response_Hours__c = slaHours[level]
    ));
}
insert contracts;

System.debug('Sample data loaded: ' +
    accounts.size() + ' accounts, ' +
    contacts.size() + ' contacts, ' +
    assets.size() + ' assets, ' +
    cases.size() + ' cases, ' +
    workOrders.size() + ' work orders, ' +
    contracts.size() + ' service contracts.');
