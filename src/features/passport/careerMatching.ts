import type { Skill } from '../skills/skillSchema'

export type CareerSkillRequirement = {
  name: string
  taxonomy_framework?: string | null
  taxonomy_code?: string | null
}

function normalizeSkillName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function matchCareerRequirements(
  requiredSkills: Array<string | CareerSkillRequirement>,
  userSkills: Array<
    Pick<Skill, 'name' | 'verified_level'>
    & Partial<Pick<Skill, 'taxonomy_framework' | 'taxonomy_code'>>
  >,
) {
  const normalizeRequirement = (requirement: string | CareerSkillRequirement) =>
    typeof requirement === 'string' ? { name: requirement } : requirement
  const indexSkills = (keyFor: (skill: typeof userSkills[number]) => string | null) => {
    const index = new Map<string, typeof userSkills[number]>()
    for (const skill of userSkills) {
      const key = keyFor(skill)
      if (!key || (index.get(key)?.verified_level && !skill.verified_level)) continue
      index.set(key, skill)
    }
    return index
  }
  const skillsByName = indexSkills((skill) => normalizeSkillName(skill.name))
  const skillsByTaxonomy = indexSkills((skill) =>
    skill.taxonomy_framework && skill.taxonomy_code
      ? `${skill.taxonomy_framework}:${skill.taxonomy_code}`
      : null)
  const matchedSkills: string[] = []
  const verifiedMatchedSkills: string[] = []
  const missingSkills: string[] = []

  for (const rawRequirement of requiredSkills) {
    const requirement = normalizeRequirement(rawRequirement)
    const taxonomyKey = requirement.taxonomy_framework && requirement.taxonomy_code
      ? `${requirement.taxonomy_framework}:${requirement.taxonomy_code}`
      : null
    const matched = (taxonomyKey && skillsByTaxonomy.get(taxonomyKey))
      || skillsByName.get(normalizeSkillName(requirement.name))

    if (!matched) {
      missingSkills.push(requirement.name)
      continue
    }
    matchedSkills.push(requirement.name)
    if (matched.verified_level) verifiedMatchedSkills.push(requirement.name)
  }

  return {
    matchedSkills,
    verifiedMatchedSkills,
    missingSkills,
    matchPercent: requiredSkills.length
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0,
  }
}
