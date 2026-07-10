import { useState } from "react"
import { EyeOffIcon, LockIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"

export function SecretInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide secret" : "Show secret"}
          aria-pressed={visible}
        >
          <HugeiconsIcon
            icon={visible ? EyeOffIcon : LockIcon}
            strokeWidth={2}
          />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
