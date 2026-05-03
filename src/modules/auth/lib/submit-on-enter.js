export const submitOnEnter = (event, submitForm) => {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    event.nativeEvent?.isComposing ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  event.preventDefault();
  submitForm();
};
