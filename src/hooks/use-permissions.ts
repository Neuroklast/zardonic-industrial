export function usePermissions() {
  const IS_PRIMARY = typeof window !== 'undefined' && window.location.hostname === 'zardonic.industrial'

  const tier = 'free' as string
  const isAgency = tier === 'agency'
  const isBypassed = IS_PRIMARY || isAgency

  const canUsePremiumThemes = () => {
    if (isBypassed) return true
    return tier === 'premium' || tier === 'agency'
  }

  const canUsePremiumWidgets = () => {
    if (isBypassed) return true
    return tier === 'premium' || tier === 'agency'
  }

  const canUseWidget = (_id: string) => {
    return true
  }

  const isThemeUnlocked = (_id: string) => {
    return canUsePremiumThemes()
  }

  return {
    isBypassed,
    canUsePremiumThemes,
    canUsePremiumWidgets,
    canUseWidget,
    isThemeUnlocked,
  }
}
