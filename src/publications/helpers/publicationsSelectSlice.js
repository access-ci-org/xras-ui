import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selected: [],
};

const publicationsSelectSlice = createSlice({
  name: "publicationsSelect",
  initialState,
  reducers: {
    setSelected: (state, { payload }) => {
      state.selected = payload;
    },
    toggleSelected: (state, { payload }) => {
      const isSelected = state.selected.includes(payload);
      if (isSelected) {
        state.selected = state.selected.filter((s) => s !== payload);
      } else {
        state.selected.push(payload);
      }
    },
    clearSelected: (state) => {
      state.selected = [];
    },
  },
});

export const {
  setSelected,
  toggleSelected,
  clearSelected,
} = publicationsSelectSlice.actions;

export const getSelected = (state) => state.publicationsSelect.selected;

export default publicationsSelectSlice.reducer;
