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
  const match = url.pathname.match(
    /^\/embed\/dashboardsv3\/([^/]+)(?:\/pages\/([A-Za-z0-9_-]+))?\/?$/,
  )
  if (
    match &&
    (url.hostname.endsWith('.databricks.com') || url.hostname.endsWith('.azuredatabricks.net'))
  )
    url.pathname =
      '/dashboardsv3/' + match[1] + '/published' + (match[2] ? '/pages/' + match[2] : '')
  return url.href
}

export function dashboardWidgetURL(value?: string, widget?: string): string | null {
  const safe = dashboardEmbedURL(value)
  const id = widget?.trim()
  if (!safe || !id || !/^[A-Za-z0-9_-]+~[A-Za-z0-9_-]+$/.test(id)) return null
  const url = new URL(safe)
  if (
    !/^\/embed\/dashboardsv3\/[^/]+\/?$/.test(url.pathname) ||
    !(url.hostname.endsWith('.databricks.com') || url.hostname.endsWith('.azuredatabricks.net'))
  )
    return null
  url.searchParams.set('fullscreenWidget', id)
  return url.href
}

export function dashboardFilteredWidgetURL(
  value: string | undefined,
  widget: string | undefined,
  filters: Record<string, string>,
): string | null {
  const safe = dashboardWidgetURL(value, widget)
  const entries = Object.entries(filters)
  if (
    !safe ||
    !entries.length ||
    entries.some(
      ([key, filter]) =>
        !/^f_[A-Za-z0-9_-]+~[A-Za-z0-9_-]+\.s$/.test(key) ||
        !filter.trim() ||
        filter.length > 200 ||
        /[\p{Cc}\p{Cs}]/u.test(filter),
    )
  )
    return null
  const url = new URL(safe)

  url.pathname = url.pathname.replace(/\/$/, '') + '/pages/' + widget!.trim().split('~')[0]
  for (const [key, filter] of entries) {
    const prefix = key.slice(0, -2)
    for (const previous of [...url.searchParams.keys()]) {
      if (previous === prefix || previous.startsWith(prefix + '.'))
        url.searchParams.delete(previous)
    }
    url.searchParams.set(key, encodeURIComponent(filter.trim()))
  }
  return url.href
}

export function dashboardUnitSelectionURL(
  value: string | undefined,
  selection: string,
  filterKeys: readonly string[],
): string | null {
  const safe = dashboardEmbedURL(value)
  if (
    !safe ||
    typeof selection !== 'string' ||
    !selection.trim() ||
    selection.length > 200 ||
    /[\p{Cc}\p{Cs}]/u.test(selection) ||
    !filterKeys.length ||
    new Set(filterKeys.map((key) => key.replace(/\.s$/, ''))).size !== filterKeys.length ||
    filterKeys.some((key) => !/^f_[A-Za-z0-9_-]+~[A-Za-z0-9_-]+(?:\.s)?$/.test(key))
  )
    return null
  const url = new URL(safe)
  if (
    !(url.hostname.endsWith('.databricks.com') || url.hostname.endsWith('.azuredatabricks.net')) ||
    !/^\/embed\/dashboardsv3\/[^/]+(?:\/pages\/[A-Za-z0-9_-]+)?\/?$/.test(url.pathname)
  )
    return null
  for (const key of filterKeys) {
    const prefix = key.endsWith('.s') ? key.slice(0, -2) : key
    for (const previous of [...url.searchParams.keys()]) {
      if (previous === prefix || previous.startsWith(prefix + '.'))
        url.searchParams.delete(previous)
    }
    url.searchParams.set(
      key,
      key.endsWith('.s') ? encodeURIComponent(selection.trim()) : selection.trim(),
    )
  }
  return url.href
}
