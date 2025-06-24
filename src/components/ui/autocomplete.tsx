import React from "react";

interface AutocompleteProps {
  value: string;
  onInputChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onInputChange,
  options,
  placeholder,
  required,
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
      <input
        ref={inputRef}
        type="text"
        className="w-full border rounded px-2 py-1 focus:outline-none"
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
          onInputChange(e.target.value);
          setShowOptions(true);
        }}
        onFocus={() => setShowOptions(true)}
        onBlur={() => setTimeout(() => setShowOptions(false), 150)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-40 overflow-y-auto">
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
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
