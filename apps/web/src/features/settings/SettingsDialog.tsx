import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Link from '@mui/material/Link'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { visuallyHidden } from '@repo-radar/util'
import { useId, useState } from 'react'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  fontSet,
  lineSpacingSet,
  motionSet,
  textScaleSet,
  type FontChoice,
  type LineSpacing,
  type MotionPreference,
  type TextScale,
} from './preferencesSlice'
import { tokenSet } from './settingsSlice'

export interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

interface ChoiceProps<T extends string> {
  label: string
  hint?: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

/**
 * Radio semantics with a segmented appearance. A slider would look tidier but
 * is worse for three discrete values: it is harder to land on one, and a screen
 * reader announces a number where radios announce "Large, 2 of 3".
 *
 * The radio is visually hidden, never `display: none`, which would remove it
 * from the accessibility tree and leave the control keyboard-dead while looking
 * fine. Its focus ring is drawn on the label instead. MUI does not wire
 * `FormLabel` to `RadioGroup`, so the group is named explicitly.
 */
function Choice<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: ChoiceProps<T>) {
  const labelId = useId()
  const hintId = useId()

  return (
    <FormControl>
      <FormLabel
        id={labelId}
        sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}
      >
        {label}
      </FormLabel>
      {hint ? (
        <Typography id={hintId} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
      <RadioGroup
        row
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
        sx={{
          gap: 0,
          mt: 0.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
          width: 'fit-content',
        }}
      >
        {options.map((option, index) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio size="small" sx={visuallyHidden} />}
            label={option.label}
            sx={{
              m: 0,
              px: 2,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              borderLeft: index === 0 ? 0 : 1,
              borderColor: 'divider',
              cursor: 'pointer',
              fontSize: 14,
              ...(value === option.value
                ? {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 600,
                  }
                : { color: 'text.secondary' }),
              '&:has(:focus-visible)': {
                outline: 2,
                outlineColor: 'primary.main',
                outlineOffset: -2,
              },
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )
}

/**
 * The token field takes focus on open. Otherwise focus stays on the trigger
 * while MUI marks the page behind the dialog `aria-hidden`, which hides a
 * focused element from assistive technology.
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const dispatch = useAppDispatch()
  const savedToken = useAppSelector((state) => state.settings.token)
  const preferences = useAppSelector((state) => state.preferences)

  const [token, setToken] = useState(savedToken ?? '')

  const saveToken = () => {
    dispatch(tokenSet(token))
  }

  const removeToken = () => {
    dispatch(tokenSet(null))
    setToken('')
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle>Settings</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" component="h3">
              GitHub access token
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unauthenticated requests are capped at 60 per hour. A token raises that to
              5,000. A token with <strong>no scopes selected</strong> is enough — this app
              only reads public data.{' '}
              <Link
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noreferrer"
              >
                Create one on GitHub
              </Link>
              .
            </Typography>

            <TextField
              autoFocus
              fullWidth
              type="password"
              label="Personal access token"
              placeholder="github_pat_…"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={saveToken}>
                Save token
              </Button>
              {savedToken ? (
                <Button size="small" color="inherit" onClick={removeToken}>
                  Remove token
                </Button>
              ) : null}
            </Stack>

            <Alert severity="info" variant="outlined">
              Stored in this browser&apos;s local storage and sent only to api.github.com.
              Any script running on this origin could read it, so clear it on a shared
              machine.
            </Alert>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="subtitle2" component="h3">
              Accessibility
            </Typography>

            <Choice<TextScale>
              label="Text size"
              value={preferences.textScale}
              onChange={(value) => dispatch(textScaleSet(value))}
              options={[
                { value: 'normal', label: 'Default' },
                { value: 'large', label: 'Large' },
                { value: 'larger', label: 'Larger' },
              ]}
            />

            <Choice<LineSpacing>
              label="Line spacing"
              hint="Wider spacing between lines of text."
              value={preferences.lineSpacing}
              onChange={(value) => dispatch(lineSpacingSet(value))}
              options={[
                { value: 'normal', label: 'Default' },
                { value: 'relaxed', label: 'Relaxed' },
              ]}
            />

            <Choice<MotionPreference>
              label="Motion"
              hint="Stops the loading pulse, transitions and chart animation. Your system setting is followed by default."
              value={preferences.motion}
              onChange={(value) => dispatch(motionSet(value))}
              options={[
                { value: 'system', label: 'Follow system' },
                { value: 'reduced', label: 'Reduce' },
              ]}
            />

            <Choice<FontChoice>
              label="Typeface"
              hint="Atkinson Hyperlegible has letterforms that are harder to confuse. Some people find it easier to read."
              value={preferences.font}
              onChange={(value) => dispatch(fontSet(value))}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'hyperlegible', label: 'Hyperlegible' },
              ]}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
