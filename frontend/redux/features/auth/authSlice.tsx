import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	token: "",
	user: "",
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		userRegistration: (state, action) => {
			state.token = action.payload.token;
		},
		userLoggedInState: (state, action) => {
			state.token = action.payload.accessToken;
			state.user = action.payload.user;
		},
		userLoggedOutState: (state, action) => {
			state.token = "";
			state.user = "";
		},
	},
});

export const { userRegistration, userLoggedInState, userLoggedOutState } =
	authSlice.actions;

export default authSlice.reducer;
