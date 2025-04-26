import React from 'react'
import { type FieldValues, type UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from './ui/label'

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any
  label: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any & FieldValues>
  required?: boolean
  type?: 'email' | 'number' | 'password' | 'text'
  validate?: (value: string) => boolean | string
}

export const FormInput: React.FC<Props> = ({
  name,
  type = 'text',
  error,
  label,
  register,
  required,
  validate,
}) => {
  // Fallback for direct register usage (without FormProvider)
  if (register) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{`${label} ${required ? '*' : ''}`}</Label>
        <Input
          className={error ? 'border-destructive' : ''}
          type={type}
          {...register(name, {
            required,
            validate,
            ...(type === 'email'
              ? {
                  pattern: {
                    message: 'Будь ласка, введіть дійсну електронну адресу',
                    value: /\S[^\s@]*@\S+\.\S+/,
                  },
                }
              : {}),
          })}
        />
        {error && (
          <p className="text-sm font-medium text-destructive">
            {!error?.message && error?.type === 'required'
              ? "Це поле є обов'язковим"
              : error?.message}
          </p>
        )}
      </div>
    )
  }

  return null
}
