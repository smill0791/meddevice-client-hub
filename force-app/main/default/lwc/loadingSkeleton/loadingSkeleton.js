import { LightningElement, api } from 'lwc';

/**
 * Shimmer loading placeholder. Renders one or more skeleton blocks while data
 * loads, giving the portal a polished, content-aware loading state instead of
 * a bare spinner.
 *
 * Variants: card | list | detail
 * Usage: <c-loading-skeleton variant="card" count="3"></c-loading-skeleton>
 */
export default class LoadingSkeleton extends LightningElement {
    // 1. Public reactive properties
    @api variant = 'card';
    @api count = 3;

    // 7. Getters
    get items() {
        const n = parseInt(this.count, 10) || 1;
        return Array.from({ length: n }, (_, i) => ({ key: `skeleton-${i}` }));
    }

    get isCard() {
        return this.variant === 'card';
    }

    get isList() {
        return this.variant === 'list';
    }

    get isDetail() {
        return this.variant === 'detail';
    }
}
