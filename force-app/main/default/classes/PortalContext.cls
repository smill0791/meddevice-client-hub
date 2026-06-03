/**
 * Shared helper that resolves the running portal user's Account context.
 *
 * Experience Cloud components either receive an explicit accountId (configured in
 * Experience Builder for testing) or fall back to the logged-in user's Account.
 * Used by: AssetController, CaseController, WorkOrderController (account-scoped queries).
 */
public with sharing class PortalContext {

    /**
     * Returns the AccountId of the running user's Contact, or null for internal
     * users (e.g., an admin previewing the site in Experience Builder).
     */
    public static Id currentAccountId() {
        List<User> users = [
            SELECT ContactId, Contact.AccountId
            FROM User
            WHERE Id = :UserInfo.getUserId()
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
        if (!users.isEmpty() && users[0].ContactId != null) {
            return users[0].Contact.AccountId;
        }
        return null;
    }

    /** Resolves an explicit accountId, falling back to the portal user's Account. */
    public static Id resolveAccountId(Id accountId) {
        return accountId != null ? accountId : currentAccountId();
    }
}
