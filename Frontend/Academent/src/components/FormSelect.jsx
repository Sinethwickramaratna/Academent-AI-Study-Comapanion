import { useEffect, useMemo, useRef, useState } from 'react';

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
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  ...props
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerId = id ? id + "-trigger" : undefined;
  const menuId = id ? id + "-menu" : undefined;
  const fieldName = name || id;
  const normalizedValue = value ?? '';
  const selectedOption = useMemo(
    () => options.find((option) => option.value === normalizedValue),
    [options, normalizedValue]
  );

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (nextValue) => {
    const event = {
      target: { id, name: fieldName, value: nextValue },
      currentTarget: { id, name: fieldName, value: nextValue },
    };
    onChange?.(event);
    setOpen(false);
  };

  return (
    <div className={"space-y-xs group " + containerClassName} ref={rootRef}>
      {label && (
        <label
          htmlFor={triggerId}
          className="text-label-md font-label-md text-on-surface group-focus-within:text-primary transition-colors flex items-center gap-1 font-semibold"
        >
          {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
          {label}
        </label>
      )}
      <div className={"relative academent-select-shell academent-custom-select" + (open ? " is-open" : "")}>
        {fieldName && <input type="hidden" name={fieldName} value={normalizedValue} required={required} />}
        <button
          id={triggerId}
          type="button"
          className={"academent-select-control academent-custom-select__trigger w-full px-md py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md input-focus appearance-none " + className}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          aria-required={required || undefined}
          disabled={disabled}
          onClick={() => !disabled && setOpen((state) => !state)}
          {...props}
        >
          <span className={selectedOption ? "academent-custom-select__value" : "academent-custom-select__value is-placeholder"}>
            {selectedOption?.label || placeholder}
          </span>
        </button>
        <span className="academent-select-icon material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
          expand_more
        </span>
        {open && (
          <div className="academent-select-menu" id={menuId} role="listbox" aria-labelledby={triggerId}>
            {options.map((option) => {
              const selected = option.value === normalizedValue;
              return (
                <button
                  type="button"
                  key={option.value}
                  className={selected ? "academent-select-option is-selected" : "academent-select-option"}
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(option.value)}
                >
                  <span>{option.label}</span>
                  {selected && <span className="material-symbols-outlined" aria-hidden="true">check</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FormSelect;
