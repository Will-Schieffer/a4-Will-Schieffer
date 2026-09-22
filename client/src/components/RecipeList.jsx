import RecipeItem from './RecipeItem.jsx'

export default function RecipeList({ recipes, onEdit, onDelete }) {
  return (
    <ul className='recipe-list list-unstyled'>
      {recipes.map(recipe => (
        <RecipeItem
          key={recipe.id}
          recipe={recipe}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
