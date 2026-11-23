
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="site-header">
      <div className="navbar-inner">

        <Link to="/" className="navbar-brand">
          HotelHub
        </Link>

        <nav className="navbar-links">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "navbar-link active" : "navbar-link"
            }
          >
            Hotels
          </NavLink>

          <NavLink
            to="/hotels/new"
            className={({ isActive }) =>
              isActive ? "navbar-link active" : "navbar-link"
            }
          >
            Add Hotel
          </NavLink>

        </nav>

      </div>
    </header>
  );
}

export default Navbar;
