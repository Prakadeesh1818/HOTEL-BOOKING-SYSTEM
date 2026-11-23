
import { useState } from "react";
import { Link } from "react-router-dom";

function HotelCard({ hotel, onDelete, deleting = false }) {
  const [imageFailed, setImageFailed] = useState(false);

  
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  const backendOrigin = new URL(apiUrl).origin;

  
  const imageUrl = hotel.image
    ? /^https?:\/\//i.test(hotel.image)
      ? hotel.image
      : `${backendOrigin}${
          hotel.image.startsWith("/") ? "" : "/"
        }${hotel.image}`
    : null;

  
  const price = Number(hotel.price);

  const formattedPrice = Number.isFinite(price)
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(price)
    : hotel.price;

  
  const handleDelete = () => {
    if (typeof onDelete !== "function") return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${hotel.title}"?`
    );

    if (confirmed) {
      onDelete(hotel.id);
    }
  };

  return (
    <article className="hotel-card">

      {}
      <div className="hotel-card-image">

        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={hotel.title}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="no-image">
            No image available
          </div>
        )}

      </div>

      {}
      <div className="hotel-card-content">

        <h3>{hotel.title}</h3>

        <p className="hotel-description">
          {hotel.description}
        </p>

        <p className="hotel-price">
          {formattedPrice}
        </p>

        {}
        <div className="hotel-card-actions">

          <Link
            to={`/hotels/${hotel.id}`}
            className="view-details-button"
          >
            View Details
          </Link>

          <Link
            to={`/hotels/${hotel.id}/edit`}
            className="edit-button"
          >
            Edit
          </Link>

          <button
            type="button"
            className="delete-button"
            onClick={handleDelete}
            disabled={!onDelete || deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </article>
  );
}

export default HotelCard;
