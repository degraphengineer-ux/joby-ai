import type { Skill } from '../skills/skillSchema'

export function matchCareerRequirements(
  requiredSkills: string[],
  userSkills: Pick<Skill, 'name' | 'verified_level'>[],
) {
  const skillsByName = new Map(
    userSkills.map((skill) => [skill.name.trim().toLocaleLowerCase(), skill]),
  )
  const matchedSkills = requiredSkills.filter((name) =>
    skillsByName.has(name.trim().toLocaleLowerCase()))
  const verifiedMatchedSkills = matchedSkills.filter((name) =>
    Boolean(skillsByName.get(name.trim().toLocaleLowerCase())?.verified_level))
  const missingSkills = requiredSkills.filter((name) =>
    !skillsByName.has(name.trim().toLocaleLowerCase()))
  return {
    matchedSkills,
    verifiedMatchedSkills,
    missingSkills,
    matchPercent: requiredSkills.length
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0,
  }
}
