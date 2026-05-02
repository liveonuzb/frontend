import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FileTextIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react";
import { get } from "lodash";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useApi from "@/hooks/api/use-api.js";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { request: api } = useApi();
  const {
    certificationType,
    certificationNumber,
    certificateFiles,
    setField,
  } = useOnboardingStore();
  const [isUploadingFiles, setIsUploadingFiles] = React.useState(false);

  useOnboardingAutoSave("coach", "coach/certification");
  const fileInputRef = React.useRef(null);

  const certMode = certificationType === "none" ? "none" : certificationType ? "custom" : "";
  const needsCertificateDetails = certMode === "custom";
  const isNextDisabled =
    !certMode ||
    (needsCertificateDetails &&
      (!String(certificationType ?? "").trim() ||
        !String(certificationNumber ?? "").trim() ||
        (certificateFiles ?? []).length === 0));

  const getFileNameFromUrl = React.useCallback((url) => {
    const raw = String(url || "")
      .split("?")[0]
      .split("/")
      .pop();
    if (!raw) return t("onboarding.coach.certification.fileFallback");
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [t]);

  const uploadSingleFile = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = response?.data?.data?.url ?? response?.data?.url ?? "";
      if (!uploadedUrl) {
        throw new Error("Upload response invalid");
      }
      return uploadedUrl;
    },
    [api],
  );

  const handleModeChange = (value) => {
    if (value === "none") {
      setField("certificationType", "none");
      setField("certificationNumber", "");
      setField("certificateFiles", []);
      return;
    }

    if (value === "custom") {
      setField(
        "certificationType",
        certificationType && certificationType !== "none"
          ? certificationType
          : "",
      );
    }
  };

  const handleCertificateFileSelect = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const invalidSize = files.find((file) => file.size > 8 * 1024 * 1024);
    if (invalidSize) {
      toast.error(t("onboarding.coach.certification.fileSizeError"));
      return;
    }

    setIsUploadingFiles(true);
    try {
      const settled = await Promise.allSettled(
        files.map((file) => uploadSingleFile(file)),
      );
      const uploadedUrls = settled
        .filter((item) => item.status === "fulfilled")
        .map((item) => item.value);
      const failedCount = settled.length - uploadedUrls.length;

      if (uploadedUrls.length > 0) {
        setField(
          "certificateFiles",
          Array.from(new Set([...(certificateFiles ?? []), ...uploadedUrls])),
        );
        toast.success(
          t("onboarding.coach.certification.uploadSuccess", {
            count: uploadedUrls.length,
          }),
        );
      }

      if (failedCount > 0) {
        toast.error(
          t("onboarding.coach.certification.uploadFailedCount", {
            count: failedCount,
          }),
        );
      }
    } catch (error) {
      const message =
        get(error, "response.data.message") ||
        t("onboarding.coach.certification.uploadError");
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const removeCertificateFile = (url) => {
    setField(
      "certificateFiles",
      (certificateFiles ?? []).filter((item) => item !== url),
    );
  };

  const handleNext = () => navigate("/coach/onboarding/bio");

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={isNextDisabled || isUploadingFiles}
      onClick={handleNext}
    >
      {t("onboarding.coach.common.continue")}
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col h-full pb-4">
      <OnboardingQuestion
        question={t("onboarding.coach.certification.question")}
      />

      <div className="space-y-5 w-full">
        <Field>
          <FieldLabel>{t("onboarding.coach.certification.statusLabel")}</FieldLabel>
          <Select value={certMode} onValueChange={handleModeChange}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t("onboarding.coach.certification.statusPlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t("onboarding.coach.certification.noCertificate")}
              </SelectItem>
              <SelectItem value="custom">
                {t("onboarding.coach.certification.hasCertificate")}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {needsCertificateDetails ? (
          <>
            <Field>
              <FieldLabel>{t("onboarding.coach.certification.nameLabel")}</FieldLabel>
              <Input
                value={certificationType}
                placeholder={t("onboarding.coach.certification.namePlaceholder")}
                onChange={(event) =>
                  setField("certificationType", event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel>{t("onboarding.coach.certification.numberLabel")}</FieldLabel>
              <Input
                value={certificationNumber}
                placeholder="ABC123456"
                onChange={(event) =>
                  setField("certificationNumber", event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel>{t("onboarding.coach.certification.filesLabel")}</FieldLabel>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploadingFiles}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingFiles ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <UploadCloudIcon className="size-4" />
                  )}
                  {t("onboarding.coach.certification.uploadButton")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleCertificateFileSelect}
                />
                <FieldDescription>
                  {t("onboarding.coach.certification.fileDescription")}
                </FieldDescription>

                {(certificateFiles ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(certificateFiles ?? []).map((url) => (
                      <div
                        key={url}
                        className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileTextIcon className="size-4 text-primary" />
                          <span className="truncate text-sm">
                            {getFileNameFromUrl(url)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 text-muted-foreground"
                          onClick={() => removeCertificateFile(url)}
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("onboarding.coach.certification.requiredFile")}
                  </p>
                )}
              </div>
            </Field>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Index;
