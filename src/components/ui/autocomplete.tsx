import React from "react";
import { ClearableInput } from "./ClearableInput";
import { isRTL } from "@/utils/languageContextUtils";

interface AutocompleteProps {
  value: string;
  onInputChange: (value: string) => void;
  onClear?: () => void; // إضافة callback عند الضغط على X
  options: string[];
  placeholder?: string;
  required?: boolean;
  renderOption?: (option: string) => React.ReactNode;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onInputChange,
  onClear,
  options,
  placeholder,
  required,
  renderOption,
}) => {
  const [showOptions, setShowOptions] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editableDivRef = React.useRef<HTMLDivElement>(null); // إضافة ref للعنصر contentEditable

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
    <div className="relative inline-block w-full">
      <div 
        ref={editableDivRef}
        className={`border-2 border-gray-200 rounded-lg py-2 min-h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400 cursor-text overflow-hidden resize-none outline-none relative empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
        contentEditable
        suppressContentEditableWarning={true}
        data-placeholder={!inputValue ? placeholder : ''}
        onInput={(e) => {
          const text = e.currentTarget.textContent || '';
          setInputValue(text);
          onInputChange(text);
          setShowOptions(true);
        }}
        onFocus={() => setShowOptions(true)}
        onBlur={() => setTimeout(() => setShowOptions(false), 150)}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
        role="textbox"
        aria-label={placeholder}
        dangerouslySetInnerHTML={{ __html: inputValue || '' }}
      />
      {inputValue && (
        <button
          type="button"
          tabIndex={-1}
          className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} text-gray-400 hover:text-gray-600 focus:outline-none`}
          onClick={() => {
            setInputValue("");
            onInputChange("");
            if (onClear) {
              onClear(); // استدعاء callback الخاص بالمسح
            }
            // Clear the specific contentEditable div using ref
            if (editableDivRef.current) {
              editableDivRef.current.innerHTML = '';
            }
          }}
        >
          <span className="text-sm">✕</span>
        </button>
      )}
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-50 bg-white border mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-full w-max max-w-lg">
          {filteredOptions.map((option, idx) => (
            <li
              key={option + idx}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 whitespace-nowrap text-sm"
              onMouseDown={() => {
                setInputValue(option);
                onInputChange(option);
                setShowOptions(false);
                inputRef.current?.blur();
              }}
            >
              <div title={option}>
                {renderOption ? renderOption(option) : option}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
