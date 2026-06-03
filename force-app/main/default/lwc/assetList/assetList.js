import { LightningElement, api, wire } from 'lwc';
import getAccountAssets from '@salesforce/apex/AssetController.getAccountAssets';

const CATEGORY_OPTIONS = [
    { label: 'All Categories', value: '' },
    { label: 'Blood Collection', value: 'Blood Collection' },
    { label: 'Apheresis', value: 'Apheresis' },
    { label: 'Cell Therapy', value: 'Cell Therapy' },
    { label: 'Transfusion', value: 'Transfusion' }
];

/**
 * Searchable, filterable grid of the portal user's installed devices.
 * Fires `assetselect` (detail: { assetId }) when a card is chosen.
 * Consumes: AssetController.getAccountAssets
 */
export default class AssetList extends LightningElement {
    // 1. Public reactive properties
    @api accountId;

    // 2. Private reactive properties
    assets = [];
    isLoading = true;
    error;
    searchTerm = '';
    selectedCategory = '';
    selectedAssetId;

    categoryOptions = CATEGORY_OPTIONS;

    // 3. Wire adapters
    @wire(getAccountAssets, { accountId: '$accountId' })
    wiredAssets({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.assets = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.assets = [];
        }
    }

    // 6. Event handlers
    handleSearch(event) {
        this.searchTerm = event.target.value;
    }

    handleCategoryChange(event) {
        this.selectedCategory = event.detail.value;
    }

    handleAssetClick(event) {
        const assetId = event.currentTarget.dataset.id;
        this.selectedAssetId = assetId;
        this.dispatchEvent(
            new CustomEvent('assetselect', { detail: { assetId } })
        );
    }

    handleAssetKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleAssetClick(event);
        }
    }

    // 7. Getters
    get filteredAssets() {
        let result = this.assets;
        const term = this.searchTerm.toLowerCase().trim();
        if (term) {
            result = result.filter(
                (a) =>
                    (a.Name && a.Name.toLowerCase().includes(term)) ||
                    (a.SerialNumber && a.SerialNumber.toLowerCase().includes(term))
            );
        }
        if (this.selectedCategory) {
            result = result.filter((a) => a.Device_Category__c === this.selectedCategory);
        }
        return result.map((a) => ({
            ...a,
            cssClass:
                a.Id === this.selectedAssetId
                    ? 'asset-card asset-card_selected'
                    : 'asset-card'
        }));
    }

    get hasAssets() {
        return this.filteredAssets.length > 0;
    }

    get isEmpty() {
        return !this.isLoading && !this.error && this.filteredAssets.length === 0;
    }

    get resultCount() {
        return this.filteredAssets.length;
    }
}
