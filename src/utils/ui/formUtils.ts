import * as React from 'react';
import { useFormContext } from 'react-hook-form';

export type FormFieldContextValue<
  TFieldValues = unknown,
  TName = unknown
> = {
  name: TName;
};

export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

export type FormItemContextValue = {
  id: string;
};

export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext) as FormFieldContextValue;
  const itemContext = React.useContext(FormItemContext) as FormItemContextValue;
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name as string, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// ضع هنا الدوال أو الثوابت غير المكونية التي كانت في form.tsx إذا كانت موجودة
