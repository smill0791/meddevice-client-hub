import { LightningElement, api } from 'lwc';
import { reduceErrors } from 'c/errorUtils';

/**
 * Displays one or more errors in an SLDS inline error scoped notification.
 * Accepts raw error objects (from @wire or imperative Apex) and reduces them
 * to readable messages via the shared errorUtils module.
 *
 * Usage: <c-error-panel errors={error}></c-error-panel>
 */
export default class ErrorPanel extends LightningElement {
    // 1. Public reactive properties
    @api friendlyMessage = 'Something went wrong while loading this content.';

    _errors;

    @api
    get errors() {
        return this._errors;
    }
    set errors(value) {
        this._errors = value;
        this.messages = reduceErrors(value);
    }

    messages = [];

    // 7. Getters
    get hasMessages() {
        return this.messages && this.messages.length > 0;
    }
}
