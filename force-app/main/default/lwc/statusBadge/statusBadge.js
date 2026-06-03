import { LightningElement, api } from 'lwc';

/**
 * Reusable status pill. Maps a status string to an SLDS theme so cases,
 * assets, and work orders render consistent, color-coded badges.
 *
 * Usage: <c-status-badge status="In Progress"></c-status-badge>
 */
export default class StatusBadge extends LightningElement {
    // 1. Public reactive properties
    @api status;
    /** Optional override label; defaults to the status value. */
    @api label;

    // 7. Getters (computed properties)
    get displayLabel() {
        return this.label || this.status || 'Unknown';
    }

    get badgeClass() {
        return `slds-badge ${this._themeClass()}`;
    }

    // 8. Private helper methods
    _themeClass() {
        const key = (this.status || '').toLowerCase();
        switch (key) {
            case 'active':
            case 'completed':
            case 'closed':
            case 'resolved':
                return 'slds-theme_success';
            case 'in progress':
            case 'scheduled':
            case 'under maintenance':
                return 'slds-theme_warning';
            case 'escalated':
            case 'cancelled':
            case 'critical':
                return 'slds-theme_error';
            case 'new':
                return 'slds-badge_inverse';
            default:
                return '';
        }
    }
}
