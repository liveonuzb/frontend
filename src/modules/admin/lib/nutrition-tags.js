import map from "lodash/map";
export const DIETARY_TAG_OPTIONS = [
  { value: "halal", label: "Halol" },
  { value: "lactose-free", label: "Laktozasiz" },
  { value: "diabetic-friendly", label: "Diabetga mos" },
  { value: "gluten-free", label: "Glutensiz" },
];

export const ALLERGEN_TAG_OPTIONS = [
  { value: "gluten", label: "Gluten" },
  { value: "lactose", label: "Laktoza" },
  { value: "nuts", label: "Yong'oq" },
  { value: "seafood", label: "Dengiz mahsulotlari" },
];

const OPTION_LABELS = new Map(
  map([...DIETARY_TAG_OPTIONS, ...ALLERGEN_TAG_OPTIONS], (item) => [
    item.value,
    item.label,
  ]),
);

export const tagLabel = (value) => OPTION_LABELS.get(value) || value;
