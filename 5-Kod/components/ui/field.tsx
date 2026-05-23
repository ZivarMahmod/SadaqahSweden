// Designsystem-primitiv — Field/Input/Textarea/Select.
// Designreferens: handoff-to-code/assets/style.css § FORMS.
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

type FieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, required, help, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className={`field-label${required ? " field-label-required" : ""}`}>
        {label}
      </label>
      {children}
      {help && !error && <span className="field-help">{help}</span>}
      {error && (
        <span role="alert" className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["input", className].filter(Boolean).join(" ")} {...rest} />;
}

export function Textarea({ className, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={["textarea", className].filter(Boolean).join(" ")} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={["select", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </select>
  );
}
