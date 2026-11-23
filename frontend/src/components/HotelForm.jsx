
import { useEffect, useState } from "react";


const EMPTY_VALUES = {};

function createFormData(initialValues) {
  return {
    title: initialValues.title ?? "",
    description: initialValues.description ?? "",
    latitude: initialValues.latitude ?? "",
    longitude: initialValues.longitude ?? "",
    price: initialValues.price ?? "",
    image: null,
  };
}


function getImageUrl(imagePath) {
  if (!imagePath) return "";

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const backendOrigin = new URL(apiUrl).origin;

  return `${backendOrigin}${
    imagePath.startsWith("/") ? "" : "/"
  }${imagePath}`;
}

function HotelForm({
  initialValues = EMPTY_VALUES,
  submitLabel = "Add Hotel",
  onSubmit,
  requireImage = true,
}) {
  
  const [formData, setFormData] = useState(() =>
    createFormData(initialValues)
  );

  
  const [errors, setErrors] = useState({});

  
  const [previewUrl, setPreviewUrl] = useState("");

  
  const [submitting, setSubmitting] = useState(false);

  
  useEffect(() => {
    setFormData(createFormData(initialValues));
    setErrors({});
  }, [initialValues]);

  
  useEffect(() => {
    if (!formData.image) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(formData.image);

    setPreviewUrl(objectUrl);

    
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [formData.image]);

  
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
      form: "",
    }));
  };

  
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        image: "Only JPG, PNG and WEBP images are allowed.",
      }));

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        image: "Image size must be 5 MB or smaller.",
      }));

      event.target.value = "";
      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      image: file,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      image: "",
      form: "",
    }));
  };

  
  const validateForm = () => {
    const newErrors = {};

    
    if (!formData.title.trim()) {
      newErrors.title = "Hotel title is required.";
    } else if (formData.title.trim().length > 150) {
      newErrors.title = "Title cannot exceed 150 characters.";
    }

    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    }

    
    const latitude = Number(formData.latitude);

    if (
      formData.latitude === "" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      newErrors.latitude =
        "Latitude must be between -90 and 90.";
    }

    
    const longitude = Number(formData.longitude);

    if (
      formData.longitude === "" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      newErrors.longitude =
        "Longitude must be between -180 and 180.";
    }

    
    const price = Number(formData.price);

    if (
      formData.price === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      newErrors.price = "Price must be greater than zero.";
    }

    
    if (requireImage && !formData.image && !initialValues.image) {
      newErrors.image = "Hotel image is required.";
    }

    return newErrors;
  };

  
  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    setErrors(validationErrors);

    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);

      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
    } catch (error) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        form: error.message || "Something went wrong.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  
  const displayedImage =
    previewUrl || getImageUrl(initialValues.image);

  return (
    <form
      className="hotel-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {}
      <div className="form-group">

        <label htmlFor="image">
          Hotel Image {requireImage ? "(Required)" : "(Optional)"}
        </label>

        {displayedImage && (
          <div className="image-preview">
            <img
              src={displayedImage}
              alt="Hotel preview"
            />
          </div>
        )}

        <input
          type="file"
          id="image"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
        />

        {formData.image && (
          <small>
            Selected: {formData.image.name}
          </small>
        )}

        {errors.image && (
          <small className="field-error">
            {errors.image}
          </small>
        )}

      </div>

      {}
      <div className="form-group">

        <label htmlFor="title">
          Hotel Title
        </label>

        <input
          type="text"
          id="title"
          name="title"
          placeholder="Enter hotel name"
          value={formData.title}
          onChange={handleChange}
          maxLength={150}
        />

        {errors.title && (
          <small className="field-error">
            {errors.title}
          </small>
        )}

      </div>

      {}
      <div className="form-group">

        <label htmlFor="description">
          Description
        </label>

        <textarea
          id="description"
          name="description"
          placeholder="Enter hotel description"
          rows="4"
          value={formData.description}
          onChange={handleChange}
        />

        {errors.description && (
          <small className="field-error">
            {errors.description}
          </small>
        )}

      </div>

      {}
      <div className="form-group">

        <label htmlFor="latitude">
          Latitude
        </label>

        <input
          type="number"
          id="latitude"
          name="latitude"
          placeholder="Enter latitude"
          min="-90"
          max="90"
          step="any"
          value={formData.latitude}
          onChange={handleChange}
        />

        {errors.latitude && (
          <small className="field-error">
            {errors.latitude}
          </small>
        )}

      </div>

      {}
      <div className="form-group">

        <label htmlFor="longitude">
          Longitude
        </label>

        <input
          type="number"
          id="longitude"
          name="longitude"
          placeholder="Enter longitude"
          min="-180"
          max="180"
          step="any"
          value={formData.longitude}
          onChange={handleChange}
        />

        {errors.longitude && (
          <small className="field-error">
            {errors.longitude}
          </small>
        )}

      </div>

      {}
      <div className="form-group">

        <label htmlFor="price">
          Price (₹)
        </label>

        <input
          type="number"
          id="price"
          name="price"
          placeholder="Enter hotel price"
          min="0.01"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
        />

        {errors.price && (
          <small className="field-error">
            {errors.price}
          </small>
        )}

      </div>

      {}
      {errors.form && (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      )}

      {}
      <button
        type="submit"
        className="submit-button"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : submitLabel}
      </button>

    </form>
  );
}

export default HotelForm;
