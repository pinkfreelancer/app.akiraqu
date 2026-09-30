import React, { useId, cloneElement, isValidElement, ReactElement, ReactNode } from 'react';

export interface FormFieldProps {
  label: ReactNode;
  children: ReactElement<any>;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  srOnlyLabel?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  hint,
  error,
  required = false,
  srOnlyLabel = false,
  className = '',
}) => {
  const autoId = useId();
  const childProps = isValidElement(children) ? (children.props as Record<string, any>) : undefined;
  const childId = childProps?.id ? childProps.id : `field-${autoId}`;
  const hintId = `hint-${autoId}`;
  const errorId = `error-${autoId}`;

  const ariaDescribedBy = error ? errorId : hint ? hintId : childProps?.['aria-describedby'];

  const clonedChild = isValidElement(children)
    ? cloneElement(children as ReactElement<any>, {
        id: childId,
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': error ? true : childProps?.['aria-invalid'],
        'aria-required': required ? true : childProps?.['aria-required'],
      })
    : children;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={childId}
        className={`block text-xs font-semibold text-[var(--text-main)] ${
          srOnlyLabel ? 'sr-only' : ''
        }`}
      >
        {label}
        {required && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
      </label>

      {clonedChild}

      {error ? (
        <div id={errorId} role="alert" className="text-xs text-rose-400 font-mono mt-1">
          {error}
        </div>
      ) : hint ? (
        <div id={hintId} className="text-xs text-[var(--text-muted)] font-mono mt-1">
          {hint}
        </div>
      ) : null}
    </div>
  );
};
