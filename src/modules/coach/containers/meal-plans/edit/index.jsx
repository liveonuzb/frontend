import { useNavigate, useParams } from "react-router";
import MealPlanFormDrawer from "../components/MealPlanFormDrawer.jsx";

const EditMealPlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <MealPlanFormDrawer
      mode="edit"
      mealPlanId={id}
      open={true}
      onOpenChange={(open) => !open && navigate(-1)}
    />
  );
};

export default EditMealPlanPage;
