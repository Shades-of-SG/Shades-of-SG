const CREATOR_SUSPENSION_MESSAGE = 'Your creator access has been suspended. You can continue using Shades of SG as a regular user, but creator tools are currently unavailable.'

function normalizeUserAccess(user) {
  if (!user) return null
  const accountStatus = user.accountStatus || user.userStatus || 'ACTIVE'
  const creatorAccessStatus = user.creatorAccessStatus || user.creatorStatus || 'ACTIVE'
  return {
    ...user,
    accountStatus,
    creatorAccessStatus,
    creatorStatus: creatorAccessStatus,
    userStatus: accountStatus,
  }
}

function hasActiveAccount(user) {
  return Boolean(user && (user.accountStatus || user.userStatus || 'ACTIVE') === 'ACTIVE')
}

function hasActiveCreatorAccess(user) {
  return Boolean(user?.role === 'CREATOR' && hasActiveAccount(user) && (user.creatorAccessStatus || user.creatorStatus || 'ACTIVE') === 'ACTIVE')
}

function hasSuspendedCreatorAccess(user) {
  return Boolean(user?.role === 'CREATOR' && hasActiveAccount(user) && (user.creatorAccessStatus || user.creatorStatus) === 'SUSPENDED')
}

export { CREATOR_SUSPENSION_MESSAGE, hasActiveAccount, hasActiveCreatorAccess, hasSuspendedCreatorAccess, normalizeUserAccess }
