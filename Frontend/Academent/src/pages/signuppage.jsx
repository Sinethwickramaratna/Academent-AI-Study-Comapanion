import { useState } from 'react'
import './signuppage.css'
import logo from '../assets/Logo/Logo.png'

function SignupPage({ onSignIn }) {
	const [currentStep, setCurrentStep] = useState(1)
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)

	const passwordScore = (() => {
		let score = 0

		if (password.length >= 8) score += 1
		if (password.length >= 12) score += 1
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
		if (/\d/.test(password)) score += 1
		if (/[^A-Za-z0-9]/.test(password)) score += 1

		return Math.min(score, 4)
	})()

	const passwordStrengthLabel = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][passwordScore]

	const handleSubmit = (event) => {
		event.preventDefault()
		setCurrentStep((step) => Math.min(step + 1, 3))
	}

	const mainButtonLabel = currentStep < 3 ? 'Continue' : 'Create Free Account'

	return (
		<main className="signup-page">
			<section className="signup-page__hero">
				<div className="signup-page__pattern" aria-hidden="true">
					<svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<pattern height="40" id="signup-grid" patternUnits="userSpaceOnUse" width="40">
								<path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"></path>
							</pattern>
						</defs>
						<rect fill="url(#signup-grid)" height="100%" width="100%"></rect>
					</svg>
				</div>

				<div className="signup-page__heroInner">
					<div className="signup-page__brandRow">
						<img alt="Academent AI Logo" className="signup-page__brandLogo" src={logo} />
						<span>Academent AI</span>
					</div>

					<div className="signup-page__heroCopy">
						<h1>
							Start Learning<br />
							<span>Smarter Today</span>
						</h1>
						<ul>
							<li>Personalized AI tutoring for every subject</li>
							<li>Automated quiz generation from study notes</li>
							<li>Smart study plans that adapt to your progress</li>
						</ul>
					</div>

					<div className="signup-page__heroIllustrationWrap">
						<img
							alt="AI Learning Hub Illustration"
							className="signup-page__heroIllustration"
							src="https://lh3.googleusercontent.com/aida/AP1WRLvSl0MPtC06vfUDPhuQr0AwIWaQVDIZ6g_UXQmC49Q3SFb2EGFLV_Yu_uq3xdr0MYTI9a6pklGPv64NAitdMfxP4gVXdC-v057kg6NHIKTtjoItNpX4BtDLu6RSlviNYj8aEWQNSRhBXs_AM-NeD8owlPN4YCjJRDygW26bwWCDmIkqaxySJj7XhX4RbVAyHRNwWqxY5uQRfcUDOBlqgPikBD_oONEEVoSMH_83aemZXbOJ9Sxh48o5uhs"
						/>

						<div className="signup-page__floatingCard signup-page__floatingCard--top">
							<p>AI Chat</p>
							<span>Explain Quantum Physics...</span>
						</div>

						<div className="signup-page__floatingCard signup-page__floatingCard--middle">
							<p>Quiz Generation</p>
							<span>10 questions ready</span>
						</div>

						<div className="signup-page__floatingCard signup-page__floatingCard--bottom">
							<p>Study Plan</p>
							<span>Optimal path found</span>
						</div>
					</div>

					<p className="signup-page__footerNote">© 2024 Academent AI. Empowering students with enlightened intelligence.</p>
				</div>
			</section>

			<section className="signup-page__formShell">
				<div className="signup-page__mobileBrand">
					<img alt="Academent AI Logo" src={logo} />
					<span>Academent AI</span>
				</div>

				<div className="signup-page__card">
					<header className="signup-page__header">
						<h2>Create your account</h2>
						<p>Join 50,000+ students learning with AI.</p>
					</header>

					<div className="signup-page__steps" aria-label="Signup progress">
						<span className={currentStep >= 1 ? 'signup-page__step signup-page__step--active' : 'signup-page__step'} />
						<span className={currentStep >= 2 ? 'signup-page__step signup-page__step--active' : 'signup-page__step'} />
						<span className={currentStep >= 3 ? 'signup-page__step signup-page__step--active' : 'signup-page__step'} />
					</div>

					<form className="signup-page__form" onSubmit={handleSubmit}>
						{currentStep === 1 ? (
							<div className="signup-page__section">
								<label>
									<span>Full Name</span>
									<input placeholder="John Doe" type="text" />
								</label>
								<label>
									<span>Email Address</span>
									<input placeholder="john@university.edu" type="email" />
								</label>
								<label>
									<div className="signup-page__fieldHeader">
										<span>Password</span>
									</div>
										<div className="signup-page__passwordWrap">
											<input
												autoComplete="new-password"
												onChange={(event) => setPassword(event.target.value)}
												placeholder="••••••••"
												type={showPassword ? 'text' : 'password'}
												value={password}
											/>
											<button
												aria-label={showPassword ? 'Hide password' : 'Show password'}
												className="signup-page__toggle"
												onClick={() => setShowPassword((current) => !current)}
												type="button"
											>
												{showPassword ? 'Hide' : 'Show'}
											</button>
										</div>
										{password.length > 0 ? (
											<>
												<div className="signup-page__strength" aria-label={`Password strength: ${passwordStrengthLabel}`}>
													{Array.from({ length: 4 }, (_, index) => (
														<span
															key={index}
															className={
																index < passwordScore
																	? 'signup-page__strengthBar signup-page__strengthBar--filled'
																	: 'signup-page__strengthBar'
															}
														/>
													))}
												</div>
												<p>{passwordStrengthLabel} password</p>
											</>
										) : null}
								</label>
							</div>
						) : null}

						{currentStep === 2 ? (
							<div className="signup-page__section">
								<label>
									<span>University</span>
									<select>
										<option>Select your institution</option>
										<option>Stanford University</option>
										<option>MIT</option>
										<option>Harvard University</option>
									</select>
								</label>

								<div className="signup-page__twoCol">
									<label>
										<span>Degree</span>
										<select>
											<option>BSc</option>
											<option>MSc</option>
											<option>PhD</option>
										</select>
									</label>
									<label>
										<span>Year</span>
										<select>
											<option>1st Year</option>
											<option>2nd Year</option>
											<option>3rd Year</option>
											<option>Final Year</option>
										</select>
									</label>
								</div>

								<div>
									<span className="signup-page__sectionLabel">Primary Subjects</span>
									<div className="signup-page__chips">
										<button type="button">Mathematics</button>
										<button className="signup-page__chipActive" type="button">Computer Science</button>
										<button type="button">Physics</button>
										<button type="button">Chemistry</button>
									</div>
								</div>
							</div>
						) : null}

						{currentStep === 3 ? (
							<div className="signup-page__section">
								<p className="signup-page__prefIntro">What should we help you with first?</p>
								<div className="signup-page__prefs">
									<label>
										<input defaultChecked type="checkbox" />
										<div>
											<span>Explain complex concepts</span>
											<small>Simple analogies for difficult topics</small>
										</div>
									</label>
									<label>
										<input type="checkbox" />
										<div>
											<span>Generate practice quizzes</span>
											<small>Active recall from your own materials</small>
										</div>
									</label>
									<label>
										<input type="checkbox" />
										<div>
											<span>Summarize lecture notes</span>
											<small>Quick bullet points and key terms</small>
										</div>
									</label>
								</div>
							</div>
						) : null}

						<div className="signup-page__actions">
							<button className="signup-page__primary" type="submit">
								{mainButtonLabel}
							</button>
							<button className="signup-page__google" type="button">
								<svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
									<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
									<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
									<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
									<path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z" fill="#EA4335"></path>
								</svg>
								Continue with Google
							</button>
						</div>
					</form>

					<p className="signup-page__signinPrompt">
						Already have an account?{' '}
						<button className="signup-page__textButton" onClick={onSignIn} type="button">
							Sign In
						</button>
					</p>

					<footer className="signup-page__footerLinks">
						<a href="#">Privacy Policy</a>
						<a href="#">Terms of Service</a>
					</footer>
				</div>
			</section>
		</main>
	)
}

export default SignupPage