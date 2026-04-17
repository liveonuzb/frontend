import { create } from "zustand";

const initialState = {
  breadcrumbs: [
    {
      url: "/",
      title: "Home",
    },
  ],
  setBreadcrumbs: () => {},
};

const useBreadcrumbStore = create((set) => ({
  ...initialState,
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
}));

export default useBreadcrumbStore;
