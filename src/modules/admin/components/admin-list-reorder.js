import map from "lodash/map";
export const buildAdminReorderPayload = ({
  items,
  activeId,
  overId,
  getId = (item) => item?.id,
}) => {
  if (!activeId || !overId || activeId === overId) return null;

  const itemIds = map(items, (item) => String(getId(item)));
  const oldIndex = itemIds.indexOf(String(activeId));
  const newIndex = itemIds.indexOf(String(overId));

  if (oldIndex < 0 || newIndex < 0) return null;

  const ordered = [...items];
  const [movedItem] = ordered.splice(oldIndex, 1);
  ordered.splice(newIndex, 0, movedItem);

  const movedIndex = ordered.findIndex(
    (item) => String(getId(item)) === String(getId(movedItem)),
  );
  const prevId =
    movedIndex > 0 ? String(getId(ordered[movedIndex - 1])) : undefined;
  const nextId =
    movedIndex < ordered.length - 1
      ? String(getId(ordered[movedIndex + 1]))
      : undefined;

  return {
    movedItem,
    movedId: String(getId(movedItem)),
    prevId,
    nextId,
    ordered,
  };
};
