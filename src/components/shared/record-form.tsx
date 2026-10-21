"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: string[];
  wide?: boolean;
  placeholder?: string;
}

export function RecordForm({
  title,
  description,
  fields,
  initialValues = {},
  submitLabel = "Save changes",
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  fields: FormField[];
  initialValues?: Record<string, string>;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((field) => [field.name, initialValues[field.name] ?? ""])));
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = fields.find((field) => field.required && !values[field.name]?.trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    onSubmit(values);
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="record-form-title">
      <div className="modal-header"><div><h2 id="record-form-title">{title}</h2><p>{description}</p></div><button className="icon-button" onClick={onClose} type="button" aria-label="Close form"><X size={17} /></button></div>
      <form onSubmit={submit}>
        <div className="modal-body">
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-grid">{fields.map((field) => <div className={`form-field ${field.wide ? "span-two" : ""}`} key={field.name}>
            <label className="field-label" htmlFor={`field-${field.name}`}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
            {field.type === "textarea" ? <textarea id={`field-${field.name}`} className="input-control" rows={3} required={field.required} value={values[field.name] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />
              : field.type === "select" ? <select id={`field-${field.name}`} className="select-control" style={{ width: "100%" }} required={field.required} value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}><option value="">Select {field.label.toLowerCase()}</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                : <input id={`field-${field.name}`} className="input-control" type={field.type ?? "text"} required={field.required} value={values[field.name] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />}
          </div>)}</div>
          <p className="field-hint">Changes are saved to this CRM workspace.</p>
        </div>
        <div className="modal-footer"><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">{submitLabel}</button></div>
      </form>
    </section>
  </div>;
}