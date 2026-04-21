import { useNavigate } from "react-router";
import WorkoutPlanFormDrawer from "../components/WorkoutPlanFormDrawer.jsx";

const CreateWorkoutPlanPage = () => {
  const navigate = useNavigate();
  return (
    <WorkoutPlanFormDrawer
      mode="create"
      open={true}
      onOpenChange={(open) => !open && navigate(-1)}
    />
  );
};

export default CreateWorkoutPlanPage;
