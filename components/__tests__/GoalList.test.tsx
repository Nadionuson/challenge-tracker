// components/__tests__/GoalList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import GoalList from '../GoalList'
import { Goal } from '@/lib/types'

const goals: Goal[] = [
  { id: 'g1', name: 'No Alcohol', startDate: '2026-04-07' },
  { id: 'g2', name: 'Exercise', startDate: '2026-04-07' },
]

const goalStats = {
  g1: { streak: 3, completed: 3, total: 5 },
  g2: { streak: 0, completed: 1, total: 5 },
}

it('renders all goals', () => {
  render(<GoalList goals={goals} checked={{}} goalStats={goalStats} onChange={jest.fn()} />)
  expect(screen.getByText('No Alcohol')).toBeInTheDocument()
  expect(screen.getByText('Exercise')).toBeInTheDocument()
})

it('calls onChange when goal is clicked', () => {
  const onChange = jest.fn()
  render(<GoalList goals={goals} checked={{}} goalStats={goalStats} onChange={onChange} />)
  fireEvent.click(screen.getByText('No Alcohol'))
  expect(onChange).toHaveBeenCalledWith('g1', true)
})

it('calls onChange with false when toggling off a checked goal', () => {
  const onChange = jest.fn()
  render(<GoalList goals={goals} checked={{ g1: true }} goalStats={goalStats} onChange={onChange} />)
  fireEvent.click(screen.getByText('No Alcohol'))
  expect(onChange).toHaveBeenCalledWith('g1', false)
})
