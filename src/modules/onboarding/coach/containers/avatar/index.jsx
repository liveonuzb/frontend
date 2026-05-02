import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { toast } from "sonner";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import useApi from "@/hooks/api/use-api.js";
import { useOnboardingStore, useAuthStore } from "@/store";
import { ImageUploadField } from "@/modules/onboarding/components/image-upload-field";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { buildCoachOnboardingPayload } from "@/modules/onboarding/lib/coach-onboarding-dto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { request: api } = useApi();
  const onboardingState = useOnboardingStore();
  const { coachAvatar, setField, reset } = onboardingState;
  const { completeAuthentication } = useAuthStore();
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  useOnboardingAutoSave("coach", "coach/avatar");
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("onboarding.coach.avatar.imageOnlyError"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("onboarding.coach.avatar.fileSizeError"));
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = response?.data?.data?.url ?? response?.data?.url ?? "";
      if (!uploadedUrl) throw new Error("Upload response invalid");
      setField("coachAvatar", uploadedUrl);
      toast.success(t("onboarding.coach.avatar.uploadSuccess"));
    } catch (error) {
      const message =
        get(error, "response.data.message") ||
        t("onboarding.coach.avatar.uploadError");
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event) => {
    processFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const payload = buildCoachOnboardingPayload(useOnboardingStore.getState());
      await api.put("/coach/onboarding/coach", payload);
      const submitResponse = await api.post("/coach/onboarding/coach/submit");
      setIsProcessing(true);
      completeAuthentication(submitResponse.data);
      setTimeout(() => {
        reset();
        navigate("/coach", { replace: true });
      }, 2200);
    } catch (error) {
      const message =
        get(error, "response.data.message") ||
        t("onboarding.coach.avatar.completeError");
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      onClick={handleComplete}
      disabled={isUploading || isSubmitting || isProcessing}
    >
      {isSubmitting || isProcessing ? (
        <>
          <Loader2Icon className="size-4 animate-spin mr-2" />
          {t("onboarding.saving")}
        </>
      ) : coachAvatar ? (
        t("onboarding.finish")
      ) : (
        t("onboarding.skip")
      )}
    </Button>,
  );

  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 h-full">
        <div className="relative flex items-center justify-center">
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <CheckCircle2Icon className="size-12 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">
            {t("onboarding.coach.avatar.successTitle")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("onboarding.coach.avatar.successDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
          <Loader2Icon className="size-4 animate-spin" />
          {t("onboarding.coach.avatar.redirecting")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full pb-4">
      <OnboardingQuestion question={t("onboarding.coach.avatar.question")} />

      <div className="flex flex-col items-center gap-6 w-full">
        <ImageUploadField
          value={coachAvatar}
          alt={t("onboarding.coach.avatar.alt")}
          isUploading={isUploading}
          isDragging={isDragging}
          inputRef={fileInputRef}
          onTrigger={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onClear={() => setField("coachAvatar", "")}
          emptyLabel={t("onboarding.coach.avatar.emptyLabel")}
          idleHint={t("onboarding.coach.avatar.idleHint")}
          replaceHint={t("onboarding.coach.avatar.replaceHint")}
          pickLabel={t("onboarding.coach.avatar.pickLabel")}
          replaceLabel={t("onboarding.coach.avatar.replaceLabel")}
        />

        <p className="text-xs text-muted-foreground text-center">
          {t("onboarding.coach.avatar.helper")}
        </p>
      </div>
    </div>
  );
};

export default Index;
