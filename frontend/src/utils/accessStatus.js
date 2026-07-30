const CREATOR_SUSPENSION_MESSAGE = 'Your creator access has been suspended. You can continue using Shades of SG as a regular user, but creator tools are currently unavailable.'

function normalizeUserAccess(user) {
  if (!user) return null
  return {
    ...user,
    accountStatus: user.accountStatus || 'ACTIVE',
    creatorAccessStatus: user.creatorAccessStatus || 'ACTIVE',
  }
}

function hasActiveAccount(user) {
  return Boolean(user && (user.accountStatus || 'ACTIVE') === 'ACTIVE')
}

function hasActiveCreatorAccess(user) {
  return Boolean(user?.role === 'CREATOR' && hasActiveAccount(user) && (user.creatorAccessStatus || 'ACTIVE') === 'ACTIVE')
}

function hasSuspendedCreatorAccess(user) {
  return Boolean(user?.role === 'CREATOR' && hasActiveAccount(user) && user.creatorAccessStatus === 'SUSPENDED')
}

export { CREATOR_SUSPENSION_MESSAGE, hasActiveAccount, hasActiveCreatorAccess, hasSuspendedCreatorAccess, normalizeUserAccess }
