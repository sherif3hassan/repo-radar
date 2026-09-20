import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 2 }}>{action}</Box> : null}
    </Box>
  )
}
