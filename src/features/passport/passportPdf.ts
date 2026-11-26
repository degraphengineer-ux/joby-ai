import type { PrivatePassport } from './passportService'

function plainText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export async function buildPassportPdf(passport: PrivatePassport): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')
  const document = new jsPDF({ format: 'a4', unit: 'mm' })
  const margin = 18
  const contentWidth = document.internal.pageSize.getWidth() - margin * 2
  const bottom = document.internal.pageSize.getHeight() - margin
  let y = margin

  const addText = (value: string, size: number, bold = false, after = 3) => {
    const text = plainText(value)
    if (!text) return
    document.setFont('helvetica', bold ? 'bold' : 'normal')
    document.setFontSize(size)
    const lines = document.splitTextToSize(text, contentWidth)
    const lineHeight = size * 0.48
    if (y + lines.length * lineHeight > bottom) {
      document.addPage()
      y = margin
    }
    document.text(lines, margin, y)
    y += lines.length * lineHeight + after
  }

  addText('Joby AI Skills Passport', 20, true, 6)
  addText(passport.profile.display_name, 16, true, 2)
  addText(passport.profile.headline ?? '', 12, false, 4)
  addText(passport.profile.bio ?? '', 10, false, 7)
  addText(`Updated ${new Date(passport.lastUpdatedAt).toLocaleDateString()}`, 9, false, 7)

  addText('Skills', 14, true, 4)
  if (!passport.skills.length) addText('No skills added.', 10)
  for (const skill of passport.skills) {
    addText(skill.name, 11, true, 1)
    addText([
      skill.category,
      `Self-reported proficiency: ${skill.self_reported_level}`,
    ].filter(Boolean).join(' | '), 9, false, 1)
    if (skill.description) addText(skill.description, 9, false, 4)
  }

  addText('Supporting evidence', 14, true, 4)
  if (!passport.evidence.length) addText('No evidence added.', 10)
  for (const evidence of passport.evidence) {
    addText(`${evidence.title} (${evidence.evidence_type.replace(/_/g, ' ')})`, 11, true, 1)
    addText(`Sharing: ${evidence.visibility}`, 9, false, 1)
    if (evidence.description) addText(evidence.description, 9, false, 1)
    if (evidence.source_url) addText(`Submitted URL: ${evidence.source_url}`, 9, false, 1)
    addText(`Submitted ${new Date(evidence.created_at).toLocaleDateString()}`, 8, false, 4)
  }

  addText('Completed assessments', 14, true, 4)
  if (!passport.assessments.length) addText('No completed assessments.', 10)
  for (const assessment of passport.assessments) {
    addText(`${assessment.title} - ${assessment.category.replace(/_/g, ' ')}`, 11, true, 1)
    addText(
      `${assessment.total_score} / ${assessment.max_score} · ${
        assessment.assessment_method === 'human_review'
          ? 'Human reviewed'
          : 'AI-assisted assessment'
      }`,
      9,
      false,
      1,
    )
    addText(assessment.overall_summary, 9, false, 2)
    for (const criterion of assessment.criteria) {
      addText(`${criterion.criterion}: ${criterion.score}/${criterion.max_score} - ${criterion.feedback}`, 8, false, 2)
    }
    y += 2
  }

  addText('This document is a user-generated summary, not an official certification. AI-assisted feedback is advisory. Public URLs and submitted evidence do not independently verify authorship.', 8, false, 0)

  return new Uint8Array(document.output('arraybuffer'))
}
