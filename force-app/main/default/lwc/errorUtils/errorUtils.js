/**
 * Shared error-reduction utility for the MedDevice Client Hub portal.
 * Flattens the many shapes an Apex/LDS/JS error can take into a simple
 * array of human-readable message strings.
 *
 * Consumed by: errorPanel, and any component that handles @wire / imperative errors.
 */
export function reduceErrors(errors) {
    if (!Array.isArray(errors)) {
        errors = [errors];
    }

    return (
        errors
            // Remove null/undefined entries
            .filter((error) => !!error)
            // Extract an error message from each error shape
            .map((error) => {
                // UI API read errors
                if (Array.isArray(error.body)) {
                    return error.body.map((e) => e.message);
                }
                // Page-level errors
                else if (error?.body?.pageErrors?.length) {
                    return error.body.pageErrors.map((e) => e.message);
                }
                // Field-level errors
                else if (error?.body?.fieldErrors &&
                    Object.keys(error.body.fieldErrors).length > 0) {
                    const fieldErrors = [];
                    Object.values(error.body.fieldErrors).forEach((errorArray) => {
                        fieldErrors.push(...errorArray.map((e) => e.message));
                    });
                    return fieldErrors;
                }
                // UI API DML, Apex and network errors
                else if (error?.body?.output?.errors?.length) {
                    return error.body.output.errors.map((e) => e.message);
                }
                // JS errors / Apex AuraHandledException
                else if (error?.body?.message && typeof error.body.message === 'string') {
                    return error.body.message;
                }
                // Plain string message
                else if (typeof error.message === 'string') {
                    return error.message;
                }
                // Unknown shape
                return error.statusText;
            })
            // Flatten and remove empty strings
            .reduce((prev, curr) => prev.concat(curr), [])
            .filter((message) => !!message)
    );
}
