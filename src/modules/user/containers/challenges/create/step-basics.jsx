import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ChallengeCoverPicker from "./challenge-cover-picker.jsx";
import { StepSection } from "./form-fields.jsx";

const StepBasics = ({ form, setForm, imagePreviewUrl, onImageChange, onImageRemove }) => (
  <StepSection
    title="Asosiy ma'lumotlar"
    description="Challenge nomi, qisqa tavsifi va ko'rinadigan cover rasmini belgilang."
  >
    <ChallengeCoverPicker
      imageFile={form.imageFile}
      imagePreviewUrl={imagePreviewUrl}
      onImageChange={onImageChange}
      onImageRemove={onImageRemove}
    />
    <div className="space-y-2">
      <label className="text-sm font-bold">Sarlavha</label>
      <Input
        value={form.title}
        onChange={(event) =>
          setForm((current) => ({ ...current, title: event.target.value }))
        }
        placeholder="Chellenj nomi"
        className="h-10"
      />
    </div>
    <div className="space-y-2">
      <label className="text-sm font-bold">Tavsif</label>
      <Textarea
        value={form.description}
        onChange={(event) =>
          setForm((current) => ({ ...current, description: event.target.value }))
        }
        placeholder="Chellenj haqida qisqacha"
        className="min-h-24 resize-none"
      />
    </div>
  </StepSection>
);

export default StepBasics;
