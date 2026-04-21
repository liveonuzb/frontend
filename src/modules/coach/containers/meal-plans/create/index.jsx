import { useNavigate } from "react-router";
import MealPlanFormDrawer from "../components/MealPlanFormDrawer.jsx";

const CreateMealPlanPage = () => {
  const navigate = useNavigate();
  return (
    <MealPlanFormDrawer
      mode="create"
      open={true}
      onOpenChange={(open) => !open && navigate(-1)}
    />
  );
};

export default CreateMealPlanPage;
