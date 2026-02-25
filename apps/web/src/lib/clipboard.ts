export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to legacy method
    }
  }

  // Legacy fallback for iOS Safari / older browsers
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)

    // iOS-specific selection
    const range = document.createRange()
    range.selectNodeContents(textarea)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    textarea.setSelectionRange(0, text.length)

    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
