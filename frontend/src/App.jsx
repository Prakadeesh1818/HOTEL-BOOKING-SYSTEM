
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import HotelListPage from "./pages/HotelListPage.jsx";
import HotelFormPage from "./pages/HotelFormPage.jsx";
import HotelDetailsPage from "./pages/HotelDetailsPage.jsx";


function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h2>404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

function App() {
  return (
    <>
      {}
      <Navbar />

      <main className="app-content">
        <Routes>

          {}
          <Route
            path="/"
            element={<HotelListPage />}
          />

          {}
          <Route
            path="/hotels/new"
            element={<HotelFormPage />}
          />

          {}
          <Route
            path="/hotels/:id/edit"
            element={<HotelFormPage />}
          />

          {}
          <Route
            path="/hotels/:id"
            element={<HotelDetailsPage />}
          />

          {}
          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Routes>
      </main>
    </>
  );
}

export default App;
