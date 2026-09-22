import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import RecipeList from './components/RecipeList.jsx'

export default function App() {
  const [username, setUsername] = useState('')
  const [recipes, setRecipes] = useState([])
  const [editingRecipe, setEditingRecipe] = useState(null)

  useEffect(() => {
    async function init() {
      await loadUser()
      await loadRecipes()
    }
    init()
  }, [])

  async function loadUser() {
    const response = await fetch('/me')

    if (response.status === 401) {
      window.location.href = '/login.html'
      return
    }

    if (response.ok) {
      const user = await response.json()
      setUsername(user.username)
    }
  }

  async function loadRecipes() {
    const response = await fetch('/recipes')

    if (response.status === 401) {
      window.location.href = '/login.html'
      return
    }

    const data = await response.json()
    setRecipes(data)
  }

  async function saveRecipe(recipe) {
    const isUpdate = editingRecipe !== null

    if (isUpdate) {
      recipe.id = editingRecipe.id
    }

    const response = await fetch(isUpdate ? '/update' : '/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    })

    if (!response.ok) {
      const error = await response.json()
      alert(error.error || 'Something went wrong.')
      return
    }

    const updated = await response.json()
    setEditingRecipe(null)
    setRecipes(updated)
  }

  async function deleteRecipe(id) {
    const response = await fetch('/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    const updated = await response.json()
    setRecipes(updated)
  }

  return (
    <>
      <Header username={username} />

      <main className='container app-main'>
        <section className='form-section'>
          <h1 className='page-title'>Your recipes</h1>
          <p className='page-subtitle'>Save any recipes you want to come back to!</p>

          <RecipeForm
            editingRecipe={editingRecipe}
            onSave={saveRecipe}
            onCancelEdit={() => setEditingRecipe(null)}
          />
        </section>

        <section className='list-section'>
          <RecipeList
            recipes={recipes}
            onEdit={setEditingRecipe}
            onDelete={deleteRecipe}
          />
        </section>
      </main>
    </>
  )
}
