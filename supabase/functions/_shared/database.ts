export type EdgeFunctionDatabase = {
  public: {
    Tables: {
      ai_processing_logs: {
        Row: {
          id: string
          user_id: string
          operation_type: string
          status: string
          model_name: string
          error_code: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          operation_type: 'skill_extraction' | 'assessment_feedback'
          status: 'started'
          model_name: string
          error_code?: string | null
        }
        Update: {
          status: 'succeeded' | 'failed'
          error_code: string | null
        }
        Relationships: []
      }
      assessment_attempts: {
        Row: {
          id: string
          assessment_id: string
          user_id: string
          submission_text: string | null
          submission_url: string | null
          status: string
          total_score: number | null
          feedback: unknown
          completed_at: string | null
          processing_started_at: string | null
          ai_skill_context_consent: boolean
        }
        Insert: Record<string, unknown>
        Update: {
          status: string
          processing_started_at: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          headline: string | null
          target_role: string | null
          years_experience: number | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string | null
          self_reported_level: 'beginner' | 'intermediate' | 'advanced' | 'unsure'
          description: string | null
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
