import type { AchievementDef } from '../types'

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'quest_accepted',
    title: 'Quest accepted',
    description: 'Opened the quest board.',
    iconKey: 'accept_quest',
  },
  {
    id: 'first_mile',
    title: 'First mile',
    description: '1 mi on the route.',
    iconKey: 'first_mile',
  },
  {
    id: 'hundred_miles',
    title: '100 miles',
    description: '100 mi covered.',
    iconKey: 'century',
  },
  {
    id: 'halfway_hero',
    title: 'Halfway',
    description: '50% of the corridor.',
    iconKey: 'halfway',
  },
  {
    id: 'entered_nebraska',
    title: 'Nebraska',
    description: 'Entered Nebraska.',
    iconKey: 'nebraska',
  },
  {
    id: 'wyoming_windrunner',
    title: 'Wyoming',
    description: 'Entered Wyoming.',
    iconKey: 'wyoming',
  },
  {
    id: 'utah_gateway',
    title: 'Utah',
    description: 'Entered Utah.',
    iconKey: 'utah',
  },
  {
    id: 'arrived_bluffdale',
    title: 'Bluffdale',
    description: 'End of route (~98.5%).',
    iconKey: 'inn',
  },
  {
    id: 'rest_break',
    title: 'Rest break',
    description: 'Parked: logged rest break in Settings.',
    iconKey: 'rest_quest',
  },
  {
    id: 'supplies_check',
    title: 'Supplies check',
    description: 'Parked: logged supplies checklist in Settings.',
    iconKey: 'inventory',
  },
]

export type EvalInput = {
  progress: number
  alongMiles: number
  unlocked: Set<string>
  manualFlags: Record<string, boolean>
}

export const evaluateAchievements = (input: EvalInput): string[] => {
  const newly: string[] = []
  const mark = (id: string, ok: boolean) => {
    if (!ok || input.unlocked.has(id)) return
    newly.push(id)
  }

  mark('quest_accepted', true)
  mark('first_mile', input.alongMiles >= 1)
  mark('hundred_miles', input.alongMiles >= 100)
  mark('halfway_hero', input.progress >= 0.5)
  mark('entered_nebraska', input.progress >= 0.4)
  mark('wyoming_windrunner', input.progress >= 0.55)
  mark('utah_gateway', input.progress >= 0.78)
  mark('arrived_bluffdale', input.progress >= 0.985)
  mark('rest_break', Boolean(input.manualFlags.rest_break))
  mark('supplies_check', Boolean(input.manualFlags.supplies_check))

  return newly
}
