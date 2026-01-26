import { createSlice } from "@reduxjs/toolkit";
import {dismissNotice} from "../../projects/helpers/apiSlice.js";

const initialState = {
    showUpdatePublications: false,
};

const dismissPublicationNoticeSlice = createSlice({
    name: "dismissPublicationNotice",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(dismissNotice.fulfilled, (state, action) => {
            if (action.payload?.success) {
                state.showUpdatePublications = false;
            }
        });
    },
});

export default dismissPublicationNoticeSlice.reducer;
