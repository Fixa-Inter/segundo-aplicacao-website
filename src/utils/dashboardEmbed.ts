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

export function dashboardViewURL(value?: string): string | null {
  const safe = dashboardEmbedURL(value)
  if (!safe) return null
  const url = new URL(safe)
  const match = url.pathname.match(/^\/embed\/dashboardsv3\/([^/]+)\/?$/)
  if (
    match &&
    (url.hostname.endsWith('.databricks.com') || url.hostname.endsWith('.azuredatabricks.net'))
  )
    url.pathname = '/dashboardsv3/' + match[1] + '/published'
  return url.href
}
