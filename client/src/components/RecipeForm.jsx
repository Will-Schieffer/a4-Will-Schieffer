import { useState, useEffect } from 'react'

const emptyForm = {
  title: '',
  url: '',
  category: 'Breakfast',
  difficulty: 'Easy',
  notes: '',
  favorite: false
}

const difficulties = ['Easy', 'Medium', 'Hard']

export default function RecipeForm({ editingRecipe, onSave, onCancelEdit }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (editingRecipe) {
      setForm({
        title: editingRecipe.title,
        url: editingRecipe.url,
        category: editingRecipe.category,
        difficulty: editingRecipe.difficulty || 'Easy',
        notes: editingRecipe.notes || '',
        favorite: !!editingRecipe.favorite
      })
    } else {
      setForm(emptyForm)
    }
  }, [editingRecipe])

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onSave({ ...form })
    setForm(emptyForm)
  }

  return (
    <form className='recipe-form' onSubmit={handleSubmit}>
      <div className='row g-3'>
        <div className='col-md-6'>
          <label htmlFor='title' className='form-label'>Recipe name</label>
          <input
            id='title'
            className='form-control'
            placeholder='e.g. Scones'
            required
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
          />
        </div>

        <div className='col-md-6'>
          <label htmlFor='url' className='form-label'>Recipe URL</label>
          <input
            id='url'
            type='url'
            className='form-control'
            placeholder='https://example.com/recipe'
            required
            value={form.url}
            onChange={e => handleChange('url', e.target.value)}
          />
        </div>

        <div className='col-md-6'>
          <label htmlFor='category' className='form-label'>Category</label>
          <select
            id='category'
            className='form-select'
            required
            value={form.category}
            onChange={e => handleChange('category', e.target.value)}
          >
            <option value='Breakfast'>Breakfast</option>
            <option value='Lunch'>Lunch</option>
            <option value='Dinner'>Dinner</option>
            <option value='Snack'>Snack</option>
            <option value='Dessert'>Dessert</option>
            <option value='Other'>Other</option>
          </select>
        </div>

        <div className='col-md-6'>
          <span className='form-label d-block'>Difficulty</span>
          {difficulties.map(level => (
            <div className='form-check form-check-inline' key={level}>
              <input
                className='form-check-input'
                type='radio'
                name='difficulty'
                id={`difficulty${level}`}
                value={level}
                checked={form.difficulty === level}
                onChange={() => handleChange('difficulty', level)}
              />
              <label className='form-check-label' htmlFor={`difficulty${level}`}>
                {level}
              </label>
            </div>
          ))}
        </div>

        <div className='col-12'>
          <label htmlFor='notes' className='form-label'>Notes</label>
          <textarea
            id='notes'
            className='form-control'
            rows='2'
            placeholder='Substitutions, tweaks, reminders...'
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
          />
        </div>

        <div className='col-12'>
          <div className='form-check'>
            <input
              className='form-check-input'
              type='checkbox'
              id='favorite'
              checked={form.favorite}
              onChange={e => handleChange('favorite', e.target.checked)}
            />
            <label className='form-check-label' htmlFor='favorite'>Mark as favorite</label>
          </div>
        </div>

        <div className='col-12 d-flex gap-2'>
          <button id='submit' type='submit' className='btn btn-primary'>
            {editingRecipe ? 'Update Recipe' : 'Save recipe'}
          </button>
        </div>
      </div>
    </form>
  )
}
