import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import getAccountCases from '@salesforce/apex/CaseController.getAccountCases';

const STATUS_OPTIONS = [
    { label: 'All Statuses', value: '' },
    { label: 'New', value: 'New' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Escalated', value: 'Escalated' },
    { label: 'Closed', value: 'Closed' }
];

const CATEGORY_OPTIONS = [
    { label: 'All Categories', value: '' },
    { label: 'Blood Collection', value: 'Blood Collection' },
    { label: 'Apheresis', value: 'Apheresis' },
    { label: 'Cell Therapy', value: 'Cell Therapy' },
    { label: 'Transfusion', value: 'Transfusion' }
];

/**
 * Filterable list of the portal user's support cases. Clicking a case navigates
 * to its detail record page. Exposes @api refresh() so a sibling (e.g. caseWizard)
 * can refresh the list after a new case is created.
 * Consumes: CaseController.getAccountCases
 */
export default class CaseList extends NavigationMixin(LightningElement) {
    // 1. Public reactive properties
    @api accountId;

    // 2. Private reactive properties
    cases = [];
    isLoading = true;
    error;
    selectedStatus = '';
    selectedCategory = '';
    searchTerm = '';

    statusOptions = STATUS_OPTIONS;
    categoryOptions = CATEGORY_OPTIONS;

    _wiredCases;

    // 3. Wire adapters
    @wire(getAccountCases, { accountId: '$accountId' })
    wiredCases(result) {
        this._wiredCases = result;
        this.isLoading = false;
        if (result.data) {
            this.cases = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.cases = [];
        }
    }

    // 5. Public methods
    @api
    refresh() {
        return refreshApex(this._wiredCases);
    }

    // 6. Event handlers
    handleStatusChange(event) {
        this.selectedStatus = event.detail.value;
    }
    handleCategoryChange(event) {
        this.selectedCategory = event.detail.value;
    }
    handleSearch(event) {
        this.searchTerm = event.target.value;
    }
    handleCaseClick(event) {
        const caseId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: caseId, objectApiName: 'Case', actionName: 'view' }
        });
    }

    // 7. Getters
    get filteredCases() {
        let result = this.cases;
        if (this.selectedStatus) {
            result = result.filter((c) => c.Status === this.selectedStatus);
        }
        if (this.selectedCategory) {
            result = result.filter((c) => c.Device_Category__c === this.selectedCategory);
        }
        const term = this.searchTerm.toLowerCase().trim();
        if (term) {
            result = result.filter(
                (c) =>
                    (c.Subject && c.Subject.toLowerCase().includes(term)) ||
                    (c.CaseNumber && c.CaseNumber.toLowerCase().includes(term))
            );
        }
        return result;
    }

    get hasCases() {
        return this.filteredCases.length > 0;
    }
    get isEmpty() {
        return !this.isLoading && !this.error && this.filteredCases.length === 0;
    }
    get resultCount() {
        return this.filteredCases.length;
    }
}
