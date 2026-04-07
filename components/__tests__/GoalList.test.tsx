// components/__tests__/GoalList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import GoalList from '../GoalList'
import { Goal } from '@/lib/types'

const goals: Goal[] = [
  { id: 'g1', name: 'No Alcohol', startDate: '2026-04-07' },
  { id: 'g2', name: 'Exercise', startDate: '2026-04-07' },
]

it('renders all goals', () => {
  render(<GoalList goals={goals} checked={{}} onChange={jest.fn()} />)
  expect(screen.getByText('No Alcohol')).toBeInTheDocument()
  expect(screen.getByText('Exercise')).toBeInTheDocument()
})

it('calls onChange when goal is clicked', () => {
  const onChange = jest.fn()
  render(<GoalList goals={goals} checked={{}} onChange={onChange} />)
  fireEvent.click(screen.getByText('No Alcohol'))
  expect(onChange).toHaveBeenCalledWith('g1', true)
})

it('calls onChange with false when toggling off a checked goal', () => {
  const onChange = jest.fn()
  render(<GoalList goals={goals} checked={{ g1: true }} onChange={onChange} />)
  fireEvent.click(screen.getByText('No Alcohol'))
  expect(onChange).toHaveBeenCalledWith('g1', false)
})
