export function dashboardEmbedURL(value?: string): string | null {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.trim())
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      [...url.searchParams.keys()].some((key) => /token|secret|password/i.test(key))
    )
      return null
    return url.href
  } catch {
    return null
  }
}
