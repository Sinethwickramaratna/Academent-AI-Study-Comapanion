import React, { useState } from 'react';

/**
 * FormInput is a reusable styled input field component.
 * Supports labels, icons, custom input types, and a built-in password visibility toggle.
 * 
 * @param {string} id - The ID of the input field.
 * @param {string} name - The name attribute of the input.
 * @param {string} label - The label text to show above the input.
 * @param {string} type - Input type (text, email, password, etc.).
 * @param {string} icon - Google Material Symbols icon name (optional).
 * @param {string} className - Additional CSS classes to apply to the input element itself.
 * @param {string} containerClassName - Additional CSS classes to apply to the wrapper div.
 * @param {boolean} required - Whether the input is required.
 * @param {string} value - The input value (controlled component).
 * @param {function} onChange - Change handler function.
 * @param {string} placeholder - Placeholder text.
 * @param {string} autoComplete - Auto-complete behavior string.
 * @param {React.ReactNode} rightLabelAction - React node to place on the right side of the label (e.g. Forgot Password link).
 */
function FormInput({
  id,
  name,
  label,
  type = 'text',
  icon,
  className = '',
  containerClassName = '',
  required = false,
  value,
  onChange,
  placeholder,
  autoComplete,
  rightLabelAction,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`space-y-xs group ${containerClassName}`}>
      <div className="flex justify-between items-center">
        {label && (
          <label
            htmlFor={id}
            className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold"
          >
            {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
            {label}
          </label>
        )}
        {rightLabelAction ? (
          rightLabelAction
        ) : isPassword ? (
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="material-symbols-outlined text-on-surface-variant cursor-pointer text-[20px] select-none hover:text-primary transition-colors"
          >
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        name={name || id}
        type={inputType}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus ${className}`}
        {...props}
      />
    </div>
  );
}

export default FormInput;
