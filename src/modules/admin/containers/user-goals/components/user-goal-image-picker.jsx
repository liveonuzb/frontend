import React from "react";
import { AdminImagePickerBase } from "@/modules/admin/components/admin-image-picker-base.jsx";

const UserGoalImagePicker = ({ value, onChange, onUploadingChange }) => (
  <AdminImagePickerBase
    value={value}
    alt="Maqsad rasmi"
    folder="user-goals"
    onChange={onChange}
    onUploadingChange={onUploadingChange}
  />
);

export default UserGoalImagePicker;
