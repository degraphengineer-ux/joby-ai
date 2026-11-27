import { supabase } from '../../lib/supabase'

export type AiPermissions = {
  profileContext: boolean
  quizSkillContext: boolean
  assessmentSkillContext: boolean
  publicUrlAnalysis: boolean
}

const defaultPermissions: AiPermissions = {
  profileContext: false,
  quizSkillContext: false,
  assessmentSkillContext: false,
  publicUrlAnalysis: false,
}

export function readAiPermissions(metadata: unknown): AiPermissions {
  if (typeof metadata !== 'object' || metadata === null || !('joby_ai_permissions' in metadata)) {
    return { ...defaultPermissions }
  }
  const permissions = metadata.joby_ai_permissions
  if (typeof permissions !== 'object' || permissions === null) return { ...defaultPermissions }

  return {
    profileContext: 'profile_context' in permissions && permissions.profile_context === true,
    quizSkillContext: 'quiz_skill_context' in permissions && permissions.quiz_skill_context === true,
    assessmentSkillContext: 'assessment_skill_context' in permissions && permissions.assessment_skill_context === true,
    publicUrlAnalysis: 'public_url_analysis' in permissions && permissions.public_url_analysis === true,
  }
}

export async function saveAiPermissions(permissions: AiPermissions): Promise<void> {
  if (!supabase) throw new Error('AI privacy settings require a configured Supabase project.')
  const { error } = await supabase.auth.updateUser({
    data: {
      joby_ai_permissions: {
        profile_context: permissions.profileContext,
        quiz_skill_context: permissions.quizSkillContext,
        assessment_skill_context: permissions.assessmentSkillContext,
        public_url_analysis: permissions.publicUrlAnalysis,
      },
    },
  })
  if (error) throw error
}
