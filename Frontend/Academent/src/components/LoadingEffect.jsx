import './LoadingEffect.css';

function LoadingEffect({
  title = 'Loading workspace',
  message = 'Preparing your study experience.',
  icon = 'auto_awesome',
  variant = 'panel',
  className = '',
}) {
  const classes = ['loading-effect', `loading-effect--${variant}`, className].filter(Boolean).join(' ');

  if (variant === 'inline') {
    return (
      <span className={classes} role="status" aria-live="polite">
        <span className="loading-effect__mini-ring" aria-hidden="true" />
        <span>{title}</span>
      </span>
    );
  }

  return (
    <section className={classes} role="status" aria-live="polite" aria-busy="true">
      <div className="loading-effect__mark" aria-hidden="true">
        <span className="loading-effect__ring" />
        <span className="loading-effect__ring loading-effect__ring--inner" />
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div className="loading-effect__copy">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>

      <div className="loading-effect__skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

export default LoadingEffect;
