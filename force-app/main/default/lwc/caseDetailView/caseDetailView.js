import { LightningElement, api, wire } from 'lwc';
import getCaseById from '@salesforce/apex/CaseController.getCaseById';

/**
 * Tabbed detail view for a single case (Overview, Comments, Timeline).
 * On a Case record page, `recordId` is injected automatically.
 * Consumes: CaseController.getCaseById
 */
export default class CaseDetailView extends LightningElement {
    // 1. Public reactive properties
    @api recordId;

    // 2. Private reactive properties
    caseRecord;
    isLoading = true;
    error;

    // 3. Wire adapters
    @wire(getCaseById, { caseId: '$recordId' })
    wiredCase({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.caseRecord = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.caseRecord = undefined;
        }
    }

    // 7. Getters
    get hasCase() {
        return !!this.caseRecord;
    }
    get isEmpty() {
        return !this.isLoading && !this.error && !this.caseRecord;
    }
    get assetName() {
        return this.caseRecord?.Asset?.Name;
    }
    get isClosed() {
        return (
            this.caseRecord &&
            (this.caseRecord.Status === 'Closed' || !!this.caseRecord.ClosedDate)
        );
    }
}
