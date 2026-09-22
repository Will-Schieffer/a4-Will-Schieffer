export default function Header({ username }) {
  return (
    <header className='topbar'>
      <div className='container topbar-inner'>
        <span className='brand'>Will Schieffer's Recipe Pinner</span>
        <div className='topbar-actions'>
          <span className='username'>{username}</span>
          <a href='/logout' className='logout-link'>Log out</a>
        </div>
      </div>
    </header>
  )
}
