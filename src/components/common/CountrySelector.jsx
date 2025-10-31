import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const countryOptions = [
    { value: "JO", label: "🇯🇴 Jordan" },
    { value: "SY", label: "🇸🇾 Syria" },
    { value: "TR", label: "🇹🇷 Turkey" },
    { value: "EG", label: "🇪🇬 Egypt" },
    { value: "LB", label: "🇱🇧 Lebanon" },
    { value: "SA", label: "🇸🇦 Saudi Arabia" }
];

export default function CountrySelector({ value, onChange, disabled }) {
  const handleChange = (newValue) => {
    if (typeof onChange === 'function') {
      onChange(newValue);
    }
  };

  const selectedCountryLabel = countryOptions.find(c => c.value === value)?.label;

  return (
    <Select value={value || ""} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a country...">
          {selectedCountryLabel || "Select a country..."}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {countryOptions.map((country) => (
          <SelectItem key={country.value} value={country.value}>
            {country.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}