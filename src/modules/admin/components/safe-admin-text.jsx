import React from "react";

import filter from "lodash/filter";

const toSafeAdminText = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const text = typeof value === "string" ? value : String(value);
  const sanitized = filter(Array.from(text), (character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || code > 31;
    })
    .join("");

  return sanitized || fallback;
};

const SafeAdminText = ({
  as: Component = "span",
  value,
  fallback = "",
  title,
  ...props
}) => {
  const text = toSafeAdminText(value, fallback);

  return (
    <Component title={title === true ? text : title} {...props}>
      {text}
    </Component>
  );
};

export default SafeAdminText;
