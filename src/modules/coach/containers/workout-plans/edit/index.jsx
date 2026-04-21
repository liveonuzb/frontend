import { useNavigate, useParams } from "react-router";
import WorkoutPlanFormDrawer from "../components/WorkoutPlanFormDrawer.jsx";

const EditWorkoutPlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <WorkoutPlanFormDrawer
      mode="edit"
      planId={id}
      open={true}
      onOpenChange={(open) => !open && navigate(-1)}
    />
  );
};

export default EditWorkoutPlanPage;
