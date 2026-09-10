import { useCallback, useEffect, useState } from 'react'
import type { Task } from '../types'

const STORAGE_KEY = 'todo-app-tasks'

function load(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Task[]) : []
  } catch {
    return []
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      /* ストレージが使えない環境では保存をスキップ */
    }
  }, [tasks])

  const addTask = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTasks((prev) => [...prev, { id: Date.now(), text: trimmed, done: false }])
  }, [])

  const toggleTask = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    )
  }, [])

  const deleteTask = useCallback((id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  const clearDone = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !task.done))
  }, [])

  return { tasks, addTask, toggleTask, deleteTask, clearDone }
}
