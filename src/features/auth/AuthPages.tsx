import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { AuthLayout } from './AuthLayout'
import { loginSchema, registrationSchema } from './AuthForms'

type AuthPageProps = {
  mode: 'login' | 'signup'
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('invalid login credentials')) {
      return 'Email or password is incorrect.'
    }
    if (message.includes('already registered')) {
      return 'An account already exists for this email.'
    }
    if (message.includes('email not confirmed')) {
      return 'Confirm your email before signing in.'
    }
    return error.message
  }
  return 'Unable to complete authentication. Please try again.'
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isRegistration = mode === 'signup'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setFieldErrors({})

    const schema = isRegistration ? registrationSchema : loginSchema
    const result = schema.safeParse({ email, password })

    if (!result.success) {
      const flattened = z.flattenError(result.error)
      setFieldErrors({
        email: flattened.fieldErrors.email?.[0],
        password: flattened.fieldErrors.password?.[0],
      })
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('Authentication is not configured yet. Add the Supabase environment values.')
      return
    }

    setIsLoading(true)

    try {
      if (isRegistration) {
        const displayName =
          result.data.email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Candidate'

        const { error: signUpError } = await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        })

        if (signUpError) throw signUpError

        setSuccess(
          'Account created. If email confirmation is enabled, confirm your email before signing in.',
        )
        setPassword('')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: result.data.email,
          password: result.data.password,
        })

        if (signInError) throw signInError
        navigate('/onboarding', { replace: true })
      }
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <section className="rounded-xl border border-navy/10 bg-white p-6 shadow-card sm:p-8">
        <p className="text-sm font-bold text-teal">
          {isRegistration ? 'Create account' : 'Welcome back'}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy">
          {isRegistration ? 'Start your Joby AI profile' : 'Sign in to Joby AI'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slatebody">
          {isRegistration
            ? 'Use an email and password you can access securely.'
            : 'Continue to your private Joby AI workspace.'}
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
            Supabase is not configured for this environment.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success" role="status">
            {success}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-navy">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className="mt-2 min-h-12 w-full rounded-lg border border-navy/15 px-3.5 text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-2 text-sm text-error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-navy">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegistration ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className="min-h-12 w-full rounded-lg border border-navy/15 px-3.5 pr-12 text-navy outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-md text-slatebody hover:bg-navy/5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-2 text-sm text-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />}
            {isRegistration ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slatebody">
          {isRegistration ? 'Already have an account?' : 'New to Joby AI?'}{' '}
          <Link
            to={isRegistration ? '/login' : '/signup'}
            className="font-bold text-teal hover:text-navy"
          >
            {isRegistration ? 'Sign in' : 'Create account'}
          </Link>
        </p>
      </section>
    </AuthLayout>
  )
}
