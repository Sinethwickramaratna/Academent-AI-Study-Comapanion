import React from 'react';

/**
 * FormSelect is a reusable dropdown select component styled to match Academent AI's design.
 * 
 * @param {string} id - The ID of the select element.
 * @param {string} name - The name attribute of the select element.
 * @param {string} label - The label text shown above the select box.
 * @param {string} icon - Google Material Symbols icon name (optional).
 * @param {Array<{value: string, label: string}>} options - Dropdown select options.
 * @param {string} value - Selected option value.
 * @param {function} onChange - Change handler function.
 * @param {string} className - Additional CSS classes to apply to select element.
 * @param {string} containerClassName - Additional CSS classes to apply to the wrapper div.
 */
function FormSelect({
  id,
  name,
  label,
  icon,
  options = [],
  value,
  onChange,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`space-y-xs group ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold"
        >
          {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          name={name || id}
          value={value}
          onChange={onChange}
          className={`w-full px-md py-3 bg-[#F9FAFB] border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus appearance-none ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
          expand_more
        </span>
      </div>
    </div>
  );
}

export default FormSelect;
