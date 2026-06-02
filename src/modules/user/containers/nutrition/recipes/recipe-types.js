/**
 * @typedef {"admin" | "user" | "ai"} RecipeSource
 * @typedef {"private" | "public"} RecipeVisibility
 *
 * @typedef {Object} RecipeIngredient
 * @property {string} id
 * @property {string=} recipeId
 * @property {string | number=} productId
 * @property {string} name
 * @property {string=} imageUrl
 * @property {number} quantity
 * @property {number=} baseQuantity
 * @property {string} unit
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number=} fiber
 * @property {number=} sugar
 * @property {number=} sodium
 * @property {boolean} isRequired
 * @property {string=} note
 *
 * @typedef {Object} RecipeStep
 * @property {string} id
 * @property {string=} recipeId
 * @property {number} order
 * @property {number=} stepNumber
 * @property {string} title
 * @property {string} description
 * @property {string=} body
 * @property {number} durationMinutes
 * @property {string=} imageUrl
 *
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {number=} catalogFoodId
 * @property {string=} slug
 * @property {string} title
 * @property {string} description
 * @property {string=} imageUrl
 * @property {string} category
 * @property {string} difficulty
 * @property {number} prepTimeMinutes
 * @property {number} cookTimeMinutes
 * @property {number} totalTimeMinutes
 * @property {number} servings
 * @property {number} caloriesPerServing
 * @property {number} proteinPerServing
 * @property {number} carbsPerServing
 * @property {number} fatPerServing
 * @property {number} fiberPerServing
 * @property {number} sugarPerServing
 * @property {number} sodiumPerServing
 * @property {number=} calories
 * @property {number=} protein
 * @property {number=} carbs
 * @property {number=} fat
 * @property {number=} fiber
 * @property {number=} sugar
 * @property {number=} sodium
 * @property {string[]} tags
 * @property {string[]} allergens
 * @property {RecipeIngredient[]} ingredients
 * @property {RecipeStep[]} steps
 * @property {RecipeStep[]=} instructions
 * @property {string} authorId
 * @property {RecipeSource} source
 * @property {RecipeVisibility} visibility
 * @property {boolean} isPublished
 * @property {boolean} isFavorite
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const RECIPE_TYPE_DOCS = true;
