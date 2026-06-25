import React from 'react';

/**
 * SelectionCard represents a clickable card with an icon and label that supports multi-select (checkbox) or single-select (radio) behavior.
 * 
 * @param {string} id - The unique ID for the input field.
 * @param {string} name - The name attribute of the input.
 * @param {string} type - Input type, either 'checkbox' or 'radio'.
 * @param {boolean} checked - Whether the card is selected/checked.
 * @param {function} onChange - Triggered when selection state changes.
 * @param {string} icon - Google Material Symbols icon name (optional).
 * @param {string} label - Title or description text inside the card.
 * @param {string} className - Extra CSS classes for the card container.
 * @param {string} cardClassName - Base style classes (defaults to 'selection-card').
 * @param {string} activeClassName - Style classes applied when active (defaults to 'selection-card-active').
 */
function SelectionCard({
  id,
  name,
  type = 'checkbox',
  checked = false,
  onChange,
  icon,
  label,
  className = '',
  cardClassName = 'selection-card',
  activeClassName = 'selection-card-active',
  ...props
}) {
  return (
    <label htmlFor={id} className="cursor-pointer group block h-full">
      <input
        id={id}
        name={name}
        type={type}
        checked={checked}
        onChange={onChange}
        className="hidden"
        {...props}
      />
      <div
        className={`${cardClassName} h-full p-lg border-2 border-surface-variant rounded-2xl flex flex-col gap-sm hover:border-primary/40 transition-all ${
          checked ? activeClassName : ''
        } ${className}`}
      >
        {icon && (
          <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform text-2xl">
            {icon}
          </span>
        )}
        <span className="font-label-md text-label-md text-on-surface font-semibold">
          {label}
        </span>
      </div>
    </label>
  );
}

export default SelectionCard;
