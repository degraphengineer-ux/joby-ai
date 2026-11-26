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
          user_id: string
          status: string
          total_score: number | null
          feedback: unknown
          completed_at: string | null
          processing_started_at: string | null
        }
        Insert: Record<string, unknown>
        Update: {
          status: string
          processing_started_at: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
