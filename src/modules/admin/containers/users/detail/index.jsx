import React from "react";
import { useNavigate, useParams } from "react-router";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import UserDetailView from "./user-detail-view.jsx";

const UserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const closeDrawer = React.useCallback(() => {
    navigate("/admin/users/list");
  }, [navigate]);

  const handleOpenChange = React.useCallback(
    (open) => {
      if (!open) closeDrawer();
    },
    [closeDrawer],
  );

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[92vh] data-[vaul-drawer-direction=bottom]:md:max-w-6xl">
        <UserDetailView userId={id} surface="drawer" onClose={closeDrawer} />
      </DrawerContent>
    </Drawer>
  );
};

export default UserDetail;
