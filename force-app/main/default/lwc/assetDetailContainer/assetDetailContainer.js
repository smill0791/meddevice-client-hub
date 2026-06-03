import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

/**
 * Parent orchestrator for the "My Devices" page. Composes the asset list with
 * the per-device detail children and manages the selected-device state.
 *
 * Data flow:
 *   - assetList fires `assetselect` -> container stores selectedAssetId
 *   - selectedAssetId flows DOWN via @api to assetDetailsPanel,
 *     serviceHistoryTimeline, and relatedCasesList
 *   - relatedCasesList fires `caseselect` -> container navigates to the case record
 *
 * This keeps the children dumb and reactive while the container owns selection.
 */
export default class AssetDetailContainer extends NavigationMixin(LightningElement) {
    // 1. Public reactive properties
    @api accountId;

    // 2. Private reactive properties
    selectedAssetId;

    // 6. Event handlers
    handleAssetSelect(event) {
        this.selectedAssetId = event.detail.assetId;
    }

    handleCaseSelect(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.detail.caseId,
                objectApiName: 'Case',
                actionName: 'view'
            }
        });
    }

    // 7. Getters
    get hasSelection() {
        return !!this.selectedAssetId;
    }
}
