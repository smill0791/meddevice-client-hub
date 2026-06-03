import { LightningElement, api, wire } from 'lwc';
import getAssetById from '@salesforce/apex/AssetController.getAssetById';

/**
 * Read-only detail view for a single device. Receives `assetId` from its parent
 * (assetDetailContainer) and queries its own data reactively.
 * Consumes: AssetController.getAssetById
 */
export default class AssetDetailsPanel extends LightningElement {
    // 1. Public reactive properties
    @api assetId;

    // 2. Private reactive properties
    asset;
    isLoading = true;
    error;

    // 3. Wire adapters
    @wire(getAssetById, { assetId: '$assetId' })
    wiredAsset({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.asset = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.asset = undefined;
        }
    }

    // 7. Getters
    get hasAsset() {
        return !!this.asset;
    }

    get isEmpty() {
        return !this.isLoading && !this.error && !this.asset;
    }

    get productName() {
        return this.asset?.Product2?.Name;
    }

    get warrantyState() {
        if (!this.asset?.Warranty_Expiry__c) {
            return null;
        }
        const expiry = new Date(this.asset.Warranty_Expiry__c);
        const today = new Date();
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
            return { label: 'Expired', class: 'slds-text-color_error', icon: 'utility:warning' };
        }
        if (daysLeft <= 90) {
            return {
                label: `Expires in ${daysLeft} day(s)`,
                class: 'slds-text-color_weak',
                icon: 'utility:clock'
            };
        }
        return { label: 'Under warranty', class: 'slds-text-color_success', icon: 'utility:success' };
    }
}
