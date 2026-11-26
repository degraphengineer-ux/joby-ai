import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { impactMetricsSchema, type ImpactMetrics } from './impactSchema'

export type { ImpactMetrics } from './impactSchema'

export async function getImpactMetrics(): Promise<ImpactMetrics> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.')
  }

  const { data, error } = await supabase.rpc('get_impact_metrics')
  if (error) throw error

  const result = z.array(impactMetricsSchema).length(1).safeParse(data)
  if (!result.success) {
    throw new Error('The impact metrics service returned an invalid aggregate.')
  }
  return result.data[0]
}
