const list = [
  { slug: 'a_mozgas_szerv_rendszere',    name: 'A mozgás szerv rendszere' },
  { slug: 'a_neuroendokrin_rendszer',    name: 'A neuroendokrin rendszer' },
  { slug: 'altalanos_anatomia_es_kortan', name: 'Általános anatómia és kórtan' },
  { slug: 'az_erzekszervek_es_emlo',     name: 'Az érzékszervek és emlő' },
  { slug: 'elsosegelynyujtas',           name: 'Elsősegélynyújtás' },
  { slug: 'emesztes',                    name: 'Emésztés' },
  { slug: 'idegrendszer',                name: 'Idegrendszer' },
  { slug: 'keringes',                    name: 'Keringés' },
  { slug: 'kivalasztas_szervrendszere',  name: 'Kiválasztás szervrendszere' },
  { slug: 'latin',                       name: 'Latin' },
  { slug: 'legzorendszer',               name: 'Légzőrendszer' },
  { slug: 'szaporodas_szervrendszere',   name: 'Szaporodás szervrendszere' },
]

export const allCategories = () => list

export const categoryBySlug = (slug) => list.find(c => c.slug === slug) || null

export const categoryFile = (category) => `${category.slug}.json`
