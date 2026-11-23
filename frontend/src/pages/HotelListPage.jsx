
import { useEffect, useState } from "react";

import { Helmet } from "react-helmet-async";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { fetchHotels } from "../features/hotels/hotelSlice";

import { deleteHotel } from "../services/api";

import HotelCard from "../components/Hotelcard.jsx";

const PAGE_SIZE = 4;

function buildQueryParams(filters, page) {
  const params = {
    page,
    limit: PAGE_SIZE,
  };

  if (filters.title.trim()) {
    params.title = filters.title.trim();
  }

  if (filters.minPrice.trim() !== "") {
    params.minPrice = filters.minPrice;
  }

  if (filters.maxPrice.trim() !== "") {
    params.maxPrice = filters.maxPrice;
  }

  return params;
}

function HotelListPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  
  const {
    hotels,
    loading,
    error,
    pagination,
  } = useSelector((state) => state.hotels);

  const [filters, setFilters] = useState({
    title: "",
    minPrice: "",
    maxPrice: "",
  });

  const [filterError, setFilterError] = useState("");
  
  const [notice, setNotice] = useState(
    location.state?.successMessage || ""
  );

  const [noticeType, setNoticeType] = useState("success");

  const [deletingId, setDeletingId] = useState(null);

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 0;

  
  const seoTitle = filters.title.trim()
    ? `Search results for ${filters.title} | HotelHub`
    : "Available Hotels | HotelHub";

  const seoDescription = filters.title.trim()
    ? `Browse hotels matching ${filters.title} on HotelHub.`
    : "Explore available hotels, compare prices, view hotel details and discover their locations.";

  
  useEffect(() => {
    dispatch(
      fetchHotels({
        page: 1,
        limit: PAGE_SIZE,
      })
    );
  }, [dispatch]);

  
  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location, navigate]);

  
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFilterError("");
  };

  
  const handleFilterSubmit = (event) => {
    event.preventDefault();

    const min = filters.minPrice.trim() === ""
      ? null
      : Number(filters.minPrice);

    const max = filters.maxPrice.trim() === ""
      ? null
      : Number(filters.maxPrice);

    if (
      min !== null &&
      (!Number.isFinite(min) || min < 0)
    ) {
      setFilterError(
        "Minimum price must be a non-negative number."
      );
      return;
    }

    if (
      max !== null &&
      (!Number.isFinite(max) || max < 0)
    ) {
      setFilterError(
        "Maximum price must be a non-negative number."
      );
      return;
    }

    if (min !== null && max !== null && min > max) {
      setFilterError(
        "Minimum price cannot be greater than maximum price."
      );
      return;
    }

    setFilterError("");
    setNotice("");

    dispatch(
      fetchHotels(buildQueryParams(filters, 1))
    );
  };

  
  const handleClearFilters = () => {
    const emptyFilters = {
      title: "",
      minPrice: "",
      maxPrice: "",
    };

    setFilters(emptyFilters);
    setFilterError("");
    setNotice("");

    dispatch(
      fetchHotels({
        page: 1,
        limit: PAGE_SIZE,
      })
    );
  };

  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    dispatch(
      fetchHotels(
        buildQueryParams(filters, page)
      )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  
  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      setNotice("");

      await deleteHotel(id);

      setNoticeType("success");
      setNotice("Hotel deleted successfully!");

      const nextPage =
        hotels.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      try {
        await dispatch(
          fetchHotels(
            buildQueryParams(filters, nextPage)
          )
        ).unwrap();
      } catch {
        setNoticeType("error");
        setNotice(
          "Hotel deleted, but the list could not refresh."
        );
      }

    } catch (error) {
      setNoticeType("error");

      setNotice(
        error.response?.data?.message ||
        error.message ||
        "Unable to delete hotel."
      );

    } finally {
      setDeletingId(null);
    }
  };

  
  const handleRetry = () => {
    dispatch(
      fetchHotels(
        buildQueryParams(filters, currentPage)
      )
    );
  };

  return (
    <>
      {}
      <Helmet>
        <title>{seoTitle}</title>

        <meta
          name="description"
          content={seoDescription}
        />

        <meta
          property="og:title"
          content={seoTitle}
        />

        <meta
          property="og:description"
          content={seoDescription}
        />

        <meta
          property="og:type"
          content="website"
        />
      </Helmet>

      <div className="hotel-list-page">

        {}
        <div className="hotel-list-heading">

          <div>
            <h2>Available Hotels</h2>

            <p>Total Hotels: {pagination.total}</p>
          </div>

          <Link
            to="/hotels/new"
            className="add-hotel-button"
          >
            + Add Hotel
          </Link>

        </div>

        {}
        <form
          className="hotel-filters"
          onSubmit={handleFilterSubmit}
        >

          <div className="filter-group">
            <label htmlFor="title">
              Search Hotel
            </label>

            <input
              type="text"
              id="title"
              name="title"
              placeholder="Enter hotel name"
              value={filters.title}
              onChange={handleChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="minPrice">
              Minimum Price (₹)
            </label>

            <input
              type="number"
              id="minPrice"
              name="minPrice"
              placeholder="Minimum price"
              min="0"
              step="any"
              value={filters.minPrice}
              onChange={handleChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxPrice">
              Maximum Price (₹)
            </label>

            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              placeholder="Maximum price"
              min="0"
              step="any"
              value={filters.maxPrice}
              onChange={handleChange}
            />
          </div>

          <div className="filter-actions">

            <button
              type="submit"
              className="search-button"
            >
              Search / Apply
            </button>

            <button
              type="button"
              className="clear-button"
              onClick={handleClearFilters}
            >
              Clear
            </button>

          </div>

        </form>

        {}
        {filterError && (
          <p className="field-error" role="alert">
            {filterError}
          </p>
        )}

        {}
        {notice && (
          <div
            className={
              noticeType === "success"
                ? "success-message"
                : "error-message"
            }
            role="status"
          >
            {notice}

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        {}
        {loading && (
          <p>Loading hotels...</p>
        )}

        {}
        {!loading && error && (
          <div>
            <p className="error-message">
              {error}
            </p>

            <button onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        {}
        {!loading && !error && (
          <>
            {hotels.length === 0 ? (
              <div className="empty-state">
                <h3>No hotels found</h3>

                <p>
                  Try changing your search or filters.
                </p>

                <button
                  className="clear-button"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="hotel-grid">

                {hotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onDelete={handleDelete}
                    deleting={
                      String(deletingId) === String(hotel.id)
                    }
                  />
                ))}

              </div>
            )}
          </>
        )}

        {}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination">

            <button
              onClick={() =>
                handlePageChange(currentPage - 1)
              }
              disabled={
                currentPage === 1 || Boolean(deletingId)
              }
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                handlePageChange(currentPage + 1)
              }
              disabled={
                currentPage === totalPages || Boolean(deletingId)
              }
            >
              Next
            </button>

          </div>
        )}

      </div>
    </>
  );
}

export default HotelListPage;
