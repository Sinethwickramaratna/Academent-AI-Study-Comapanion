import { useState } from 'react'
import './loginpage.css'
import logo from '../assets/Logo/Logo.png'
import { getFriendlyAuthError, signInWithGoogle } from '../Services/authService'

function LoginPage({ onCreateAccount, onLoginSuccess }) {
	const [showPassword, setShowPassword] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const handleSubmit = (event) => {
		event.preventDefault()
	}

	const handleGoogleLogin = async () => {
		setErrorMessage('')
		setIsSubmitting(true)
		try {
			const userCredential = await signInWithGoogle()
			const { user } = userCredential
			setIsSubmitting(false)
			if (onLoginSuccess) {
				onLoginSuccess(user.email, user.emailVerified)
			}
		} catch (error) {
			setIsSubmitting(false)
			setErrorMessage(getFriendlyAuthError(error))
		}
	}

	return (
		<main className="login-page">
			<section className="login-page__hero">
				<div className="login-page__heroGlow login-page__heroGlow--top" aria-hidden="true" />
				<div className="login-page__heroGlow login-page__heroGlow--bottom" aria-hidden="true" />

				<div className="login-page__heroContent">
					<div className="login-page__illustrationWrap">
						<img
							alt="Academent AI illustration"
							className="login-page__illustration"
							src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkj33h6D2g47USm3BTh4VzuA111iK4ACG3usigVIwfGLHfi2xWsvi0AkXcOe7znjwiKzu_Xk8js_8wkQ8aM8i9-dUKfIu0hGXitlPPL6tTfQC4dSGY1aYEzCTx_KlDf8S_b-0EI3Qza29GnuHmJpgh88GCoG3C064oGNeHDeTACwvlw_XYeG9TGSYI1h9QgKoOao2JF8PXux-EFi9P59f2b2YIM_nQdfO4Hq1RxV_mqaRjAQp8geKAEEMORW5lMpGTHfbstJPSCxo"
						/>
					</div>

					<div className="login-page__heroCopy">
						<h1>
							Learn Smarter <br />with <span>AI</span>
						</h1>
						<p>
							Personalized learning, instant explanations, study planning, and
							exam success in one platform.
						</p>
					</div>

					<div className="login-page__socialProof">
						<div className="login-page__avatars" aria-hidden="true">
							<span className="login-page__avatar">JD</span>
							<span className="login-page__avatar login-page__avatar--secondary">ML</span>
							<span className="login-page__avatar login-page__avatar--tertiary">AK</span>
						</div>
						<div>
							<p className="login-page__proofTitle">Trusted by 10k+ students</p>
							<div className="login-page__stars" aria-label="Five star rating">
								★★★★★
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="login-page__formShell">
				<div className="login-page__pattern" aria-hidden="true" />

				<div className="login-page__brand login-page__brand--mobile">
					<img alt="Academent AI logo" className="login-page__logo" src={logo} />
					<span>Academent AI</span>
				</div>

				<div className="login-page__card">
					<div className="login-page__headingBlock">
						<div className="login-page__brand login-page__brand--desktop">
							<img alt="Academent AI logo" className="login-page__logo" src={logo} />
							<span>Academent AI</span>
						</div>

						<h2>Welcome Back</h2>
						<p>Access your personalized dashboard</p>
					</div>

					<form className="login-page__form" onSubmit={handleSubmit}>
						<label className="login-page__field">
							<span>Email Address</span>
							<div className="login-page__inputWrap">
								<span className="login-page__icon" aria-hidden="true">@</span>
								<input
									autoComplete="email"
									name="email"
									placeholder="name@university.edu"
									type="email"
								/>
							</div>
						</label>

						<div className="login-page__field">
							<div className="login-page__fieldRow">
								<label htmlFor="password">Password</label>
								<a href="#">Forgot Password?</a>
							</div>

							<div className="login-page__inputWrap">
								<span className="login-page__icon" aria-hidden="true">⌁</span>
								<input
									autoComplete="current-password"
									id="password"
									name="password"
									placeholder="••••••••"
									type={showPassword ? 'text' : 'password'}
								/>
								<button
									aria-label={showPassword ? 'Hide password' : 'Show password'}
									className="login-page__toggle"
									onClick={() => setShowPassword((current) => !current)}
									type="button"
								>
									{showPassword ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<label className="login-page__remember">
							<input name="remember" type="checkbox" />
							<span>Remember me for 30 days</span>
						</label>

						{errorMessage && (
							<div className="login-page__error">
								{errorMessage}
							</div>
						)}

						<div className="login-page__actions">
							<button className="login-page__primary" type="submit" disabled={isSubmitting}>
								Sign In
								<span aria-hidden="true">→</span>
							</button>

							<div className="login-page__divider">
								<span>Or continue with</span>
							</div>

							<button
								onClick={handleGoogleLogin}
								disabled={isSubmitting}
								className="login-page__google"
								type="button"
							>
								<svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
									<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
									<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
									<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
									<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
								</svg>
								Continue with Google
							</button>
						</div>
					</form>

					<div className="login-page__signup">
						<p>
							New here?{' '}
							<button className="login-page__textButton" onClick={onCreateAccount} type="button">
								Create an account
							</button>
						</p>
					</div>

					<footer className="login-page__footerLinks">
						<a href="#">Privacy Policy</a>
						<a href="#">Terms of Service</a>
						<a href="#">Help Center</a>
					</footer>
				</div>
			</section>
		</main>
	)
}

export default LoginPage
