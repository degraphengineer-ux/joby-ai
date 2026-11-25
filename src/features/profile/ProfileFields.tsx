import type { Dispatch, SetStateAction } from 'react'
import { Input } from '../../components/ui/Input'
import type { ProfileInput } from './profileSchema'

type ProfileFieldErrors = Partial<Record<keyof ProfileInput, string>>

export function ProfileFields({
  value,
  onChange,
  errors,
}: {
  value: ProfileInput
  onChange: Dispatch<SetStateAction<ProfileInput>>
  errors: ProfileFieldErrors
}) {
  const updateText = (key: keyof ProfileInput, next: string) => {
    onChange((current) => ({ ...current, [key]: next }))
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <Input
          label="Display name"
          name="display_name"
          autoComplete="name"
          maxLength={80}
          required
          value={value.display_name}
          onChange={(event) => updateText('display_name', event.target.value)}
          aria-invalid={Boolean(errors.display_name)}
          aria-describedby={errors.display_name ? 'display-name-error' : undefined}
        />
        {errors.display_name && (
          <p id="display-name-error" className="mt-1 text-sm text-error">{errors.display_name}</p>
        )}
      </div>
      <div>
        <Input
          label="Professional headline"
          name="headline"
          placeholder="e.g. Frontend developer"
          maxLength={120}
          value={value.headline}
          onChange={(event) => updateText('headline', event.target.value)}
          aria-invalid={Boolean(errors.headline)}
          aria-describedby={errors.headline ? 'headline-error' : undefined}
        />
        {errors.headline && (
          <p id="headline-error" className="mt-1 text-sm text-error">{errors.headline}</p>
        )}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="bio" className="block text-sm font-semibold text-navy">Short bio</label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={500}
          value={value.bio}
          onChange={(event) => updateText('bio', event.target.value)}
          placeholder="A few sentences about the work you enjoy and the skills you bring."
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={errors.bio ? 'bio-error' : undefined}
          className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-base text-navy outline-none placeholder:text-slatebody/60 focus:border-teal focus:ring-4 focus:ring-teal/10"
        />
        {errors.bio && <p id="bio-error" className="mt-1 text-sm text-error">{errors.bio}</p>}
      </div>
      <div>
        <Input
          label="Location (optional)"
          name="location"
          autoComplete="address-level2"
          placeholder="City or region"
          maxLength={80}
          value={value.location}
          onChange={(event) => updateText('location', event.target.value)}
          aria-invalid={Boolean(errors.location)}
          aria-describedby={errors.location ? 'location-error' : undefined}
        />
        {errors.location && (
          <p id="location-error" className="mt-1 text-sm text-error">{errors.location}</p>
        )}
      </div>
      <div>
        <Input
          label="Target role"
          name="target_role"
          placeholder="e.g. UX designer"
          maxLength={120}
          value={value.target_role}
          onChange={(event) => updateText('target_role', event.target.value)}
          aria-invalid={Boolean(errors.target_role)}
          aria-describedby={errors.target_role ? 'target-role-error' : undefined}
        />
        {errors.target_role && (
          <p id="target-role-error" className="mt-1 text-sm text-error">{errors.target_role}</p>
        )}
      </div>
      <div>
        <label htmlFor="years_experience" className="block text-sm font-semibold text-navy">
          Years of experience <span className="font-normal text-slatebody">(optional)</span>
        </label>
        <input
          id="years_experience"
          name="years_experience"
          type="number"
          min={0}
          max={80}
          step={0.5}
          value={value.years_experience ?? ''}
          onChange={(event) => {
            const raw = event.target.value
            onChange((current) => ({
              ...current,
              years_experience: raw === '' ? null : Number(raw),
            }))
          }}
          aria-invalid={Boolean(errors.years_experience)}
          aria-describedby={errors.years_experience ? 'years-error' : undefined}
          className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3.5 text-base text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
        />
        {errors.years_experience && (
          <p id="years-error" className="mt-1 text-sm text-error">{errors.years_experience}</p>
        )}
      </div>
    </div>
  )
}
