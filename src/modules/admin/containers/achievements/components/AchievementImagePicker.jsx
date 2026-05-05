import React from "react";
import { AdminImagePickerBase } from "@/modules/admin/components/admin-image-picker-base.jsx";

const AchievementImagePicker = ({
  label = "Rasm",
  value,
  onChange,
  onUploadingChange,
}) => (
  <AdminImagePickerBase
    label={label}
    value={value}
    alt={label}
    folder="achievements"
    onChange={onChange}
    onUploadingChange={onUploadingChange}
  />
);

export default AchievementImagePicker;
