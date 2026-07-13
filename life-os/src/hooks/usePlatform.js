// Detects whether running inside a Capacitor native shell or plain browser.
// Capacitor sets window.Capacitor when the native bridge is active.
export function usePlatform() {
  const cap = window.Capacitor
  const isNative = cap?.isNativePlatform?.() ?? false
  const platform = cap?.getPlatform?.() ?? 'web'   // 'ios' | 'android' | 'web'
  const isIOS     = platform === 'ios'
  const isAndroid = platform === 'android'
  return { isNative, isIOS, isAndroid, platform }
}
