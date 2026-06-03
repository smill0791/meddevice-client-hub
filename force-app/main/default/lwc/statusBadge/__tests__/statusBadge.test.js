import { createElement } from 'lwc';
import StatusBadge from 'c/statusBadge';

describe('c-status-badge', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('uses the status as the label by default and a success theme', () => {
        const element = createElement('c-status-badge', { is: StatusBadge });
        element.status = 'Active';
        document.body.appendChild(element);

        const span = element.shadowRoot.querySelector('span');
        expect(span.textContent).toBe('Active');
        expect(span.className).toContain('slds-theme_success');
    });

    it('maps escalated to the error theme', () => {
        const element = createElement('c-status-badge', { is: StatusBadge });
        element.status = 'Escalated';
        document.body.appendChild(element);

        expect(element.shadowRoot.querySelector('span').className).toContain('slds-theme_error');
    });

    it('maps in progress to the warning theme', () => {
        const element = createElement('c-status-badge', { is: StatusBadge });
        element.status = 'In Progress';
        document.body.appendChild(element);

        expect(element.shadowRoot.querySelector('span').className).toContain('slds-theme_warning');
    });

    it('honors a label override', () => {
        const element = createElement('c-status-badge', { is: StatusBadge });
        element.status = 'New';
        element.label = 'Brand New';
        document.body.appendChild(element);

        expect(element.shadowRoot.querySelector('span').textContent).toBe('Brand New');
    });
});
