import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { toastOptions } from "@/utils/ui/sonnerUtils"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={toastOptions}
      {...props}
    />
  )
}

export { Toaster }
