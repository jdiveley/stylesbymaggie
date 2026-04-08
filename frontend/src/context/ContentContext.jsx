import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/axios'

const ContentContext = createContext({})

export const ContentProvider = ({ children }) => {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)

  const refresh = () =>
    api.get('/content')
      .then((res) => setContent(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { refresh() }, [])

  return (
    <ContentContext.Provider value={{ content, loading, refresh }}>
      {children}
    </ContentContext.Provider>
  )
}

// useContent(key, fallback) — returns the live value or the fallback while loading
export const useContent = (key, fallback = '') => {
  const { content } = useContext(ContentContext)
  return key in content ? content[key] : fallback
}

// useContentContext() — for the editor panel which needs refresh()
export const useContentContext = () => useContext(ContentContext)
