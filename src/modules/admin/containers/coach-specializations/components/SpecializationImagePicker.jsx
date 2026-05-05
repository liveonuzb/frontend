import React from "react";
import { AdminImagePickerBase } from "@/modules/admin/components/admin-image-picker-base.jsx";

const SpecializationImagePicker = ({ value, onChange, onUploadingChange }) => (
  <AdminImagePickerBase
    value={value}
    alt="Yo'nalish rasmi"
    folder="coach-specializations"
    uploadText="Custom rasm yuklash"
    onChange={onChange}
    onUploadingChange={onUploadingChange}
  />
);

export default SpecializationImagePicker;
