export default function RecipeItem({ recipe, onEdit, onDelete }) {
  return (
    <li className='recipe-row'>
      <div className='recipe-main'>
        <a href={recipe.url} target='_blank' rel='noreferrer' className='recipe-title'>
          {recipe.favorite ? '\u2605 ' : ''}{recipe.title}
        </a>

        <div className='recipe-meta'>
          <span>{recipe.category}</span>
          <span>{recipe.difficulty || 'Easy'}</span>
          <span>{recipe.domain}</span>
        </div>

        {recipe.notes && <div className='recipe-notes'>{recipe.notes}</div>}
      </div>

      <div className='recipe-actions'>
        <button className='btn btn-sm btn-outline-secondary' onClick={() => onEdit(recipe)}>
          Edit
        </button>
        <button className='btn btn-sm btn-outline-danger' onClick={() => onDelete(recipe.id)}>
          Delete
        </button>
      </div>
    </li>
  )
}
