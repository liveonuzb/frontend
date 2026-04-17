import { filter, orderBy } from "lodash";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useGalleryStore = create(
    persist(
        (set, get) => ({
            photos: [],

            addPhoto: (photo) =>
                set((state) => ({
                    photos: [
                        {
                            id: Date.now(),
                            createdAt: new Date().toISOString(),
                            ...photo,
                        },
                        ...state.photos,
                    ],
                })),

            removePhoto: (id) =>
                set((state) => ({
                    photos: filter(state.photos, (p) => p.id !== id),
                })),

            getPhotosByDate: () => {
                const photos = get().photos;
                return orderBy(photos, [(p) => new Date(p.createdAt)], ["desc"]);
            },
        }),
        { name: "gallery-storage" }
    )
);

export default useGalleryStore;
