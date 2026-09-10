export interface Task {
  id: number
  text: string
  done: boolean
}

export type Filter = 'all' | 'active' | 'done'
