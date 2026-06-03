import { LightningElement, api } from 'lwc';

/**
 * Reusable empty-state placeholder: an icon, a title, a message, and an
 * optional call-to-action button. Used wherever a list or detail has no data.
 *
 * Fires: action (when the CTA button is clicked)
 */
export default class EmptyState extends LightningElement {
    // 1. Public reactive properties
    @api title = 'Nothing here yet';
    @api message;
    @api iconName = 'utility:info';
    @api actionLabel;

    // 6. Event handlers
    handleAction() {
        this.dispatchEvent(new CustomEvent('action'));
    }

    // 7. Getters
    get hasAction() {
        return !!this.actionLabel;
    }
}
