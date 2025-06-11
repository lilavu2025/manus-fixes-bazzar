import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  error?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  error
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="phone">{label}</Label>
      <Input
        id="phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;