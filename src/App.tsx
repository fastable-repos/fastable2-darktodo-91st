import { useState, useEffect, useCallback } from 'react'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

type Filter = 'all' | 'active' | 'completed'

const STORAGE_TODOS = 'darktodo_todos'
const STORAGE_DARKMODE = 'darktodo_darkmode'

function generateId(): string {
  return crypto.randomUUID()
}

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_TODOS)
    if (!raw) return []
    return JSON.parse(raw) as Todo[]
  } catch (err) {
    console.error('Failed to load todos from localStorage', err)
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_TODOS, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage', err)
  }
}

function loadDarkMode(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_DARKMODE)
    if (raw === null) return true // default to dark mode
    return raw === 'true'
  } catch (err) {
    console.error('Failed to load dark mode preference', err)
    return true
  }
}

function saveDarkMode(darkMode: boolean): void {
  try {
    localStorage.setItem(STORAGE_DARKMODE, String(darkMode))
  } catch (err) {
    console.error('Failed to save dark mode preference', err)
  }
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [darkMode, setDarkMode] = useState<boolean>(loadDarkMode)
  const [filter, setFilter] = useState<Filter>('all')
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  useEffect(() => {
    saveDarkMode(darkMode)
  }, [darkMode])

  const addTodo = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [...prev, newTodo])
    setInputValue('')
  }, [inputValue])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(todo => !todo.completed))
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const activeCount = todos.filter(todo => !todo.completed).length
  const completedCount = todos.filter(todo => todo.completed).length

  const accent = '#4ecca3'

  // Theme-aware class helpers
  const bg = darkMode ? 'bg-[#1a1a2e]' : 'bg-[#f5f5f5]'
  const cardBg = darkMode ? 'bg-[#16213e]' : 'bg-white'
  const textPrimary = darkMode ? 'text-[#e0e0e0]' : 'text-[#2d2d2d]'
  const textSecondary = darkMode ? 'text-[#a0a0b0]' : 'text-[#888888]'
  const borderColor = darkMode ? 'border-[#2a2a4a]' : 'border-gray-200'

  const emptyMessage =
    filter === 'all'
      ? 'No todos yet — add one above!'
      : filter === 'active'
      ? 'No active todos!'
      : 'No completed todos yet!'

  return (
    <div
      className={`min-h-screen ${bg} transition-colors duration-300`}
      data-testid="app"
      data-darkmode={String(darkMode)}
    >
      {/* ── Header ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-10 ${cardBg} border-b ${borderColor} shadow-lg transition-colors duration-300`}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
            DarkTodo
          </h1>

          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            data-testid="theme-toggle"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              darkMode
                ? 'bg-[#2a2a4e] hover:bg-[#3a3a5e] text-yellow-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {darkMode ? (
              /* Sun icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07l-.71.71M6.34 17.66l-.71.71m12.02 0l-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z"
                />
              </svg>
            ) : (
              /* Moon icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        {/* Input */}
        <div
          className={`${cardBg} rounded-2xl shadow-xl p-4 mb-6 transition-colors duration-300`}
        >
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addTodo()
              }}
              placeholder="What needs to be done?"
              data-testid="todo-input"
              className={`flex-1 bg-transparent outline-none text-base px-2 py-1 transition-colors duration-300 ${textPrimary} ${
                darkMode ? 'placeholder-[#505070]' : 'placeholder-gray-400'
              }`}
            />
            <button
              onClick={addTodo}
              data-testid="add-button"
              className="px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95 text-[#1a1a2e]"
              style={{ backgroundColor: accent }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all duration-200 ${
                filter === f
                  ? 'text-[#1a1a2e] shadow-md'
                  : darkMode
                  ? 'text-[#a0a0b0] hover:text-[#e0e0e0] bg-[#16213e] hover:bg-[#1e2d4e]'
                  : 'text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50'
              }`}
              style={filter === f ? { backgroundColor: accent } : {}}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Todo List Card */}
        <div
          className={`${cardBg} rounded-2xl shadow-xl overflow-hidden transition-colors duration-300`}
        >
          {filteredTodos.length === 0 ? (
            <div
              className={`py-16 text-center ${textSecondary} transition-colors duration-300`}
              data-testid="empty-state"
            >
              <div className="text-4xl mb-3">✓</div>
              <p className="text-base">{emptyMessage}</p>
            </div>
          ) : (
            <ul data-testid="todo-list">
              {filteredTodos.map((todo, index) => (
                <li
                  key={todo.id}
                  data-testid="todo-item"
                  className={`flex items-center gap-3 px-5 py-4 transition-colors duration-200 ${
                    index < filteredTodos.length - 1 ? `border-b ${borderColor}` : ''
                  } ${darkMode ? 'hover:bg-[#1e2d50]' : 'hover:bg-gray-50'}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                    data-testid="todo-checkbox"
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      borderColor: todo.completed ? accent : darkMode ? '#505070' : '#cccccc',
                      backgroundColor: todo.completed ? accent : 'transparent',
                    }}
                  >
                    {todo.completed && (
                      <svg
                        className="w-3 h-3 text-[#1a1a2e]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Text */}
                  <span
                    className={`flex-1 text-base transition-all duration-200 ${
                      todo.completed ? `line-through ${textSecondary}` : textPrimary
                    }`}
                  >
                    {todo.text}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    aria-label="Delete todo"
                    data-testid="delete-button"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      darkMode
                        ? 'text-[#a0a0b0] hover:text-red-400 hover:bg-[#2a1a2a]'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div
            className={`mt-4 flex items-center justify-between px-2 text-sm ${textSecondary} transition-colors duration-300`}
            data-testid="todo-footer"
          >
            <span data-testid="active-count">
              {activeCount} {activeCount === 1 ? 'item' : 'items'} left
            </span>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                data-testid="clear-completed"
                className={`transition-colors duration-200 ${
                  darkMode ? 'hover:text-red-400' : 'hover:text-red-500'
                }`}
              >
                Clear Completed
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
