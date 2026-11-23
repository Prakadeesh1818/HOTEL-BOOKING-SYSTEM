
import { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { Helmet } from "react-helmet-async";

import HotelForm from "../components/HotelForm.jsx";

import {
  getHotelById,
  createHotel,
  updateHotel,
} from "../services/api.js";

const EMPTY_HOTEL = {
  title: "",
  description: "",
  latitude: "",
  longitude: "",
  price: "",
  image: null,
};

function HotelFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  
  const isEdit = Boolean(id);

  
  const [hotel, setHotel] = useState(null);

  
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");

  
  useEffect(() => {
    if (!isEdit) {
      setHotel(null);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchHotel = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getHotelById(id);

        if (active) {
          setHotel(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to load hotel details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchHotel();

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  
  const pageTitle = isEdit
    ? hotel
      ? `Edit ${hotel.title} | HotelHub`
      : "Edit Hotel | HotelHub"
    : "Add New Hotel | HotelHub";

  const pageDescription = isEdit
    ? "Update hotel information, location, image and price on HotelHub."
    : "Add a new hotel with its image, description, location and price on HotelHub.";

  
  const handleSubmit = async (formData) => {
    const data = new FormData();

    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("latitude", formData.latitude);
    data.append("longitude", formData.longitude);
    data.append("price", formData.price);

    
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (isEdit) {
        await updateHotel(id, data);

        navigate("/", {
          state: {
            successMessage: "Hotel updated successfully!",
          },
        });
      } else {
        await createHotel(data);

        navigate("/", {
          state: {
            successMessage: "Hotel added successfully!",
          },
        });
      }
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        "Unable to save hotel."
      );
    }
  };

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
      </Helmet>

      <div className="hotel-form-page">

        {loading ? (
          <p>Loading hotel details...</p>
        ) : error ? (
          <>
            <h2>Unable to Load Hotel</h2>

            <p className="field-error">
              {error}
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
            >
              Back to Hotels
            </button>
          </>
        ) : (
          <>
            <h2>
              {isEdit ? "Edit Hotel" : "Add New Hotel"}
            </h2>

            <p>
              {isEdit
                ? "Update the hotel information below."
                : "Enter the details of your new hotel."}
            </p>

            <HotelForm
              key={id || "new"}
              initialValues={hotel || EMPTY_HOTEL}
              submitLabel={
                isEdit ? "Update Hotel" : "Add Hotel"
              }
              onSubmit={handleSubmit}
              requireImage={!isEdit}
            />
          </>
        )}

      </div>
    </>
  );
}

export default HotelFormPage;
