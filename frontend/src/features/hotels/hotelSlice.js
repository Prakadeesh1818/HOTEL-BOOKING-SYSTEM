
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { getHotels } from "../../services/api";


export const fetchHotels = createAsyncThunk(
  "hotels/fetchHotels",

  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getHotels(params);

      return response.data;

    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch hotels"
      );
    }
  }
);


const initialState = {
  hotels: [],
  selectedHotel: null,

  loading: false,
  error: null,

  pagination: {
    total: 0,
    page: 1,
    limit: 4,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};


const hotelSlice = createSlice({
  name: "hotels",

  initialState,

  reducers: {
    setSelectedHotel: (state, action) => {
      state.selectedHotel = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  
  extraReducers: (builder) => {

    
    builder.addCase(fetchHotels.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    
    builder.addCase(fetchHotels.fulfilled, (state, action) => {
      state.loading = false;

      state.hotels = action.payload.hotels;

      state.pagination = action.payload.pagination;
    });

    
    builder.addCase(fetchHotels.rejected, (state, action) => {
      state.loading = false;

      state.error =
        action.payload || action.error.message;
    });
  },
});

export const {
  setSelectedHotel,
  clearError,
} = hotelSlice.actions;

export default hotelSlice.reducer;
