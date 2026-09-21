// FRONT-END (CLIENT) JAVASCRIPT HERE
const form = document.querySelector( '#recipeForm' )
const list = document.querySelector( '#recipeList' )
const submitButton = document.querySelector( '#submit' )
const usernameLabel = document.querySelector( '#username' )

let editingID = null

const submit = async function( event ) {
  // stop form submission from trying to load
  // a new .html page for displaying results...
  // this was the original browser behavior and still
  // remains to this day
  event.preventDefault()

  const titleInput = document.querySelector( '#title' )
  const urlInput = document.querySelector( '#url' )
  const categoryInput = document.querySelector( '#category' )
  const notesInput = document.querySelector( '#notes' )
  const favoriteInput = document.querySelector( '#favorite' )
  const difficultyInput = document.querySelector( 'input[name="difficulty"]:checked' )

  const recipe = {
    title: titleInput.value,
    url: urlInput.value,
    category: categoryInput.value,
    notes: notesInput.value,
    favorite: favoriteInput.checked,
    difficulty: difficultyInput ? difficultyInput.value : 'Easy'
  }

  let response

  if (editingID !== null) {
    recipe.id = editingID

    response = await fetch( '/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( recipe )
    })

  } else {
    response = await fetch( '/submit', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( recipe )
    })
  }

  /* Helps to handle failed fetch requests */
  if (!response.ok) {
    const error = await response.json()
    alert(error.error || 'Something went wrong.')
    return
  }

  const recipes = await response.json()

  editingID = null
  submitButton.textContent = 'Save recipe'
  form.reset()

  renderRecipes( recipes )
}

const renderRecipes = function( recipes ) {
  const list = document.querySelector( '#recipeList' )

  list.innerHTML = ''

  recipes.forEach( function( recipe ) {
    const li = document.createElement( 'li' )
    li.className = 'recipe-row'

    const main = document.createElement( 'div' )
    main.className = 'recipe-main'

    const a = document.createElement( 'a' )
    a.href = recipe.url
    a.target = '_blank'
    a.className = 'recipe-title'
    a.textContent = ( recipe.favorite ? '\u2605 ' : '' ) + recipe.title

    const meta = document.createElement( 'div' )
    meta.className = 'recipe-meta'

    const category = document.createElement( 'span' )
    category.textContent = recipe.category

    const difficulty = document.createElement( 'span' )
    difficulty.textContent = recipe.difficulty || 'Easy'

    const domain = document.createElement( 'span' )
    domain.textContent = recipe.domain

    meta.appendChild( category )
    meta.appendChild( difficulty )
    meta.appendChild( domain )

    main.appendChild( a )
    main.appendChild( meta )

    if (recipe.notes) {
      const notes = document.createElement( 'div' )
      notes.className = 'recipe-notes'
      notes.textContent = recipe.notes
      main.appendChild( notes )
    }

    const actions = document.createElement( 'div' )
    actions.className = 'recipe-actions'

    const editButton = document.createElement( 'button' )
    editButton.textContent = 'Edit'
    editButton.className = 'btn btn-sm btn-outline-secondary'
    editButton.onclick = function() {
      editRecipe( recipe )
    }

    const deleteButton = document.createElement( 'button' )
    deleteButton.textContent = 'Delete'
    deleteButton.className = 'btn btn-sm btn-outline-danger'
    deleteButton.onclick = function() {
      deleteRecipe( recipe.id )
    }

    actions.appendChild( editButton )
    actions.appendChild( deleteButton )

    li.appendChild( main )
    li.appendChild( actions )
    list.appendChild( li )
  })
}

const deleteRecipe = async function( id ) {
  const response = await fetch( '/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify( { id } )
  })

  const recipes = await response.json()
  renderRecipes( recipes )
}

const loadRecipes = async function() {
  const response = await fetch( '/recipes' )

  // Bounce back to login if auth fails
  if (response.status === 401) {
    window.location.href = '/login.html'
    return
  }

  const recipes = await response.json()
  renderRecipes( recipes )
}

const loadUser = async function() {
  const response = await fetch( '/me' )

  // Back to login if auth fails again
  if (response.status === 401) {
    window.location.href = '/login.html'
    return
  }

  if (response.ok) {
    const user = await response.json()
    usernameLabel.textContent = user.username
  }
}

window.onload = async function() {
  form.addEventListener('submit', submit)

  await loadUser()
  await loadRecipes()
}

const editRecipe = function( recipe ) {
  document.querySelector( '#title' ).value = recipe.title
  document.querySelector( '#url' ).value = recipe.url
  document.querySelector( '#category' ).value = recipe.category
  document.querySelector( '#notes' ).value = recipe.notes || ''
  document.querySelector( '#favorite' ).checked = !!recipe.favorite

  const difficultyValue = recipe.difficulty || 'Easy'
  const difficultyRadio = document.querySelector( `input[name="difficulty"][value="${difficultyValue}"]` )
  if (difficultyRadio) difficultyRadio.checked = true

  submitButton.textContent = 'Update Recipe'

  editingID = recipe.id
}
