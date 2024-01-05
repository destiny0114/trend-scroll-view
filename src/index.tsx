import { createRoot } from 'react-dom/client'
import './index.css'
import App from 'App'

const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

root.render(
  <main className="mx-auto h-[700px] w-[1200px] overflow-hidden rounded-md bg-gray-100 p-6 shadow-md">
    <App />
  </main>
)
