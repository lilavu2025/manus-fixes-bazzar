import React from "react";
import { ClearableInput } from "./ClearableInput";
import { isRTL } from "@/utils/languageContextUtils";

interface AutocompleteProps {
  value: string;
  onInputChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  renderOption?: (option: string) => React.ReactNode;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onInputChange,
  options,
  placeholder,
  required,
  renderOption,
}) => {
  const [showOptions, setShowOptions] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const filteredOptions = options.filter(
    (option) =>
      option &&
      option.toLowerCase().includes(inputValue.toLowerCase()) &&
      option !== inputValue
  );

  return (
    <div className="relative">
      <ClearableInput
        ref={inputRef}
        type="text"
        className={`border-2 border-gray-200 rounded-lg py-2 h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400 ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
          onInputChange(e.target.value);
          setShowOptions(true);
        }}
        onClear={() => {
          setInputValue("");
          onInputChange("");
        }}
        onFocus={() => setShowOptions(true)}
        onBlur={() => setTimeout(() => setShowOptions(false), 150)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full mt-1 rounded-lg shadow max-h-60 overflow-y-auto">
          {filteredOptions.map((option, idx) => (
            <li
              key={option + idx}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              onMouseDown={() => {
                setInputValue(option);
                onInputChange(option);
                setShowOptions(false);
                inputRef.current?.blur();
              }}
            >
              {renderOption ? renderOption(option) : option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
