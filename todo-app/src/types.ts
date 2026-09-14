export type Priority = 'high' | 'med' | 'low'

export interface Task {
  id: number
  text: string
  done: boolean
  priority: Priority
}

export type Filter = 'all' | 'active' | 'done'
