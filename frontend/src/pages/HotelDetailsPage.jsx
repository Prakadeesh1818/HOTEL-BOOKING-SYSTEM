
import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { Helmet } from "react-helmet-async";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { getHotelById } from "../services/api.js";


const hotelMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const BACKEND_ORIGIN = new URL(API_URL).origin;


function getImageUrl(imagePath) {
  if (!imagePath) return "";

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${BACKEND_ORIGIN}${
    imagePath.startsWith("/") ? "" : "/"
  }${imagePath}`;
}

function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  
  useEffect(() => {
    let active = true;

    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setHotel(null);
        setImageFailed(false);

        const response = await getHotelById(id);

        if (active) {
          setHotel(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to fetch hotel details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchHotelDetails();

    return () => {
      active = false;
    };
  }, [id]);

  
  const pageTitle = hotel
    ? `${hotel.title} | HotelHub`
    : "Hotel Details | HotelHub";

  const pageDescription = hotel
    ? `View ${hotel.title} details, description, price and location on HotelHub.`
    : "Explore hotel information, prices and locations on HotelHub.";

  
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Hotel | HotelHub</title>
        </Helmet>

        <div className="hotel-details-page">
          <p>Loading hotel details...</p>
        </div>
      </>
    );
  }

  
  if (error) {
    return (
      <>
        <Helmet>
          <title>Hotel Not Available | HotelHub</title>
        </Helmet>

        <div className="hotel-details-page">
          <h2>Unable to Load Hotel</h2>

          <p className="field-error" role="alert">
            {error}
          </p>

          <button
            className="back-button"
            onClick={() => navigate("/")}
          >
            Back to Hotels
          </button>
        </div>
      </>
    );
  }

  
  if (!hotel) {
    return (
      <>
        <Helmet>
          <title>Hotel Not Found | HotelHub</title>
        </Helmet>

        <div className="hotel-details-page">
          <h2>Hotel Not Found</h2>

          <button
            className="back-button"
            onClick={() => navigate("/")}
          >
            Back to Hotels
          </button>
        </div>
      </>
    );
  }

  
  const latitude = Number(hotel.latitude);
  const longitude = Number(hotel.longitude);

  const validCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  
  const imageUrl = getImageUrl(hotel.image);

  
  const price = Number(hotel.price);

  const formattedPrice = Number.isFinite(price)
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(price)
    : hotel.price;

  return (
    <>
      {}
      <Helmet>
        <title>{pageTitle}</title>

        <meta
          name="description"
          content={pageDescription}
        />

        <meta
          property="og:title"
          content={pageTitle}
        />

        <meta
          property="og:description"
          content={pageDescription}
        />

        <meta
          property="og:type"
          content="website"
        />
      </Helmet>

      <div className="hotel-details-page">

        {}
        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Hotels
        </button>

        {}
        <div className="details-image">

          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={`${hotel.title} hotel`}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="no-image">
              No image available
            </div>
          )}

        </div>

        {}
        <div className="hotel-details-content">

          <h2>{hotel.title}</h2>

          <p className="details-description">
            {hotel.description}
          </p>

          <h3 className="details-price">
            {formattedPrice}
          </h3>

          <div className="details-information">

            <p>
              <strong>Hotel ID:</strong> {hotel.id}
            </p>

            <p>
              <strong>Latitude:</strong> {hotel.latitude}
            </p>

            <p>
              <strong>Longitude:</strong> {hotel.longitude}
            </p>

          </div>

          {}
          <div className="hotel-map-section">

            <h3>Hotel Location</h3>

            {validCoordinates ? (
              <MapContainer
                key={hotel.id}
                center={[latitude, longitude]}
                zoom={13}
                scrollWheelZoom={false}
                className="hotel-map"
              >

                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                  position={[latitude, longitude]}
                  icon={hotelMarkerIcon}
                >
                  <Popup>
                    {hotel.title}
                  </Popup>
                </Marker>

              </MapContainer>
            ) : (
              <p className="field-error">
                Valid location coordinates are not available.
              </p>
            )}

          </div>

          {}
          <button
            className="edit-button"
            onClick={() =>
              navigate(`/hotels/${hotel.id}/edit`)
            }
          >
            Edit Hotel
          </button>

        </div>

      </div>
    </>
  );
}

export default HotelDetailsPage;
