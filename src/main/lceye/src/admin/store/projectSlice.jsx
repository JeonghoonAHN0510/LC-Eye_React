import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedProject: null,
};

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        setSelectedProject: (state, action) => {
            state.selectedProject = action.payload;
        },
        clearSelectedProject: (state) => {
            state.selectedProject = null;
        },
    },
});

export default projectSlice.reducer;
export const { setSelectedProject, clearSelectedProject } = projectSlice.actions;
