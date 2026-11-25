insert into public.assessments (
  title,
  category,
  description,
  instructions,
  rubric,
  difficulty,
  is_active
)
select
  'Responsive Profile Card',
  'web_development',
  'Demonstrate responsive web layout fundamentals by building or describing a profile card.',
  'Build a responsive profile card using HTML and CSS, or submit a public project link and a concise description of the layout. Provide enough evidence for the reviewer to judge requirement completion, semantic structure, responsive behavior, code clarity and accessibility basics. A URL alone is not proof of quality or authorship.',
  jsonb_build_object(
    'dimensions', jsonb_build_array(
      jsonb_build_object(
        'criterion', 'Requirement completion',
        'max_score', 4,
        'description', 'The submitted work addresses the requested profile-card deliverable.'
      ),
      jsonb_build_object(
        'criterion', 'Semantic structure',
        'max_score', 4,
        'description', 'The work uses appropriate and understandable HTML structure.'
      ),
      jsonb_build_object(
        'criterion', 'Responsive behavior',
        'max_score', 4,
        'description', 'The layout adapts appropriately across viewport sizes.'
      ),
      jsonb_build_object(
        'criterion', 'Code clarity',
        'max_score', 4,
        'description', 'The HTML and CSS are organized, understandable and maintainable.'
      ),
      jsonb_build_object(
        'criterion', 'Accessibility basics',
        'max_score', 4,
        'description', 'The submission considers readable structure, labels and basic keyboard or contrast needs.'
      )
    ),
    'score_range', jsonb_build_object('minimum', 0, 'maximum', 4),
    'total_max_score', 20,
    'method_label', 'AI-assisted assessment',
    'limitations', 'This result is advisory and is not an official qualification or independent certification.'
  ),
  'beginner',
  true
where not exists (
  select 1
  from public.assessments
  where category = 'web_development'
    and title = 'Responsive Profile Card'
);
