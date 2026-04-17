import { includes, filter, map, take } from "lodash";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useRecipesStore = create()(
    persist(
        (set, get) => ({
            favorites: [], // [recipeId, ...]
            cookedHistory: [], // [{ recipeId, date, rating }]
            shoppingList: [], // [{ name, amount, checked }]

            toggleFavorite: (recipeId) => {
                set((state) => {
                    const isFav = includes(state.favorites, recipeId);
                    return {
                        favorites: isFav
                            ? filter(state.favorites, (id) => id !== recipeId)
                            : [...state.favorites, recipeId],
                    };
                });
            },

            isFavorite: (recipeId) => includes(get().favorites, recipeId),

            logCooked: (recipe) => {
                set((state) => ({
                    cookedHistory: take([
                        {
                            recipeId: recipe.id,
                            name: recipe.name,
                            date: new Date().toISOString(),
                            calories: recipe.calories,
                        },
                        ...state.cookedHistory,
                    ], 50),
                }));
            },

            addToShoppingList: (ingredients) => {
                set((state) => {
                    const newItems = map(ingredients, (ing) => ({
                        id: crypto.randomUUID(),
                        name: ing.name,
                        amount: ing.amount,
                        checked: false,
                    }));
                    return { shoppingList: [...state.shoppingList, ...newItems] };
                });
            },

            toggleShoppingItem: (itemId) => {
                set((state) => ({
                    shoppingList: map(state.shoppingList, (item) =>
                        item.id === itemId ? { ...item, checked: !item.checked } : item
                    ),
                }));
            },

            clearShoppingList: () => set({ shoppingList: [] }),

            removeShoppingItem: (itemId) => {
                set((state) => ({
                    shoppingList: filter(state.shoppingList, (i) => i.id !== itemId)
                }));
            }
        }),
        {
            name: "recipes-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useRecipesStore;
