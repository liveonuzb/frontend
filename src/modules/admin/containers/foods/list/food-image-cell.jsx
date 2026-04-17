const FoodImageCell = ({ food }) => {
  if (food.imageUrl) {
    return (
      <img
        src={food.imageUrl}
        alt={food.name}
        className="size-10 rounded-xl object-cover border"
      />
    );
  }

  return (
    <div className="size-10 rounded-xl bg-muted border flex items-center justify-center text-xs text-muted-foreground">
      No
    </div>
  );
};

export default FoodImageCell;
