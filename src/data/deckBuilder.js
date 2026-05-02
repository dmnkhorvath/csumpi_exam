const synId = (categorySlug, group, index) => {
  const text = group?.[0]?.data?.question_text ?? `idx${index}`
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `syn:${categorySlug}:${(h >>> 0).toString(36)}`
}

export const groupsToCardDescriptors = (categoryFile, categorySlug) => {
  const groups = categoryFile.groups || []
  return groups.map((group, idx) => {
    const raw = group[0]?.similarity_group_id
    const id = raw && !raw.startsWith('__null_') ? raw : synId(categorySlug, group, idx)
    return { id, categorySlug, members: group }
  })
}
