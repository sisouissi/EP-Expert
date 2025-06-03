
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, containerClassName, labelClassName, ...props }) => (
  <div className={containerClassName}>
    <label htmlFor={id} className={`block text-sm font-medium text-slate-700 mb-1.5 ${labelClassName}`}>
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out placeholder-slate-400 text-slate-800"
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
  containerClassName?: string;
  labelClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, options, containerClassName, labelClassName, ...props }) => (
  <div className={containerClassName}>
    <label htmlFor={id} className={`block text-sm font-medium text-slate-700 mb-1.5 ${labelClassName}`}>
      {label}
    </label>
    <select
      id={id}
      {...props}
      className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out text-slate-800"
    >
      {options.map(option => (
        <option key={option.value} value={option.value} className="text-slate-800">
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string | React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, id, containerClassName, labelClassName, ...props }) => (
  <div className={`flex items-start ${containerClassName}`}>
    <div className="flex items-center h-5 mt-0.5">
      <input
        id={id}
        type="checkbox"
        {...props}
        className={`focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-400 rounded transition duration-150 ease-in-out ${props.className}`}
      />
    </div>
    <div className="ml-3 text-sm">
      <label htmlFor={id} className={`font-medium text-slate-700 ${labelClassName}`}>
        {label}
      </label>
    </div>
  </div>
);
