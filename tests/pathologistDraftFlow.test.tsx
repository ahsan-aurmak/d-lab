import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

describe('Pathologist draft workflow', () => {
  it('persists edited values when saving a draft', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /switch persona/i }))
    expect(await screen.findByText('Validation Queue')).toBeInTheDocument()

    await user.click(screen.getByText('REQ-001'))
    expect(await screen.findByText('Human-in-the-Loop Validation')).toBeInTheDocument()

    const [ldlInput] = screen.getAllByRole('spinbutton')
    expect(ldlInput).toHaveValue(160)

    await user.clear(ldlInput)
    await user.type(ldlInput, '155')
    expect(ldlInput).toHaveValue(155)

    await user.click(screen.getByRole('button', { name: /save changes to draft/i }))
    expect(screen.queryByText('Human-in-the-Loop Validation')).not.toBeInTheDocument()

    await user.click(screen.getByText('REQ-001'))
    const [ldlInputAfterReopen] = screen.getAllByRole('spinbutton')
    expect(ldlInputAfterReopen).toHaveValue(155)
  })
})
