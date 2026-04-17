import React from "react";
import { useNavigate } from "react-router";
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
    if (!raw) return "Sertifikat fayli";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, []);

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
      toast.error("Har bir fayl 8MB dan katta bo'lmasligi kerak");
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
        toast.success(`${uploadedUrls.length} ta sertifikat fayli yuklandi`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} ta faylni yuklab bo'lmadi`);
      }
    } catch (error) {
      const message =
        get(error, "response.data.message") || "Fayllarni yuklab bo'lmadi";
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
      Davom etish
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col h-full pb-4">
      <OnboardingQuestion question="Sertifikat ma'lumotlari" />

      <div className="space-y-5 w-full">
        <Field>
          <FieldLabel>Sertifikat holati</FieldLabel>
          <Select value={certMode} onValueChange={handleModeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Variantni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sertifikatim yo'q</SelectItem>
              <SelectItem value="custom">Sertifikatim bor</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {needsCertificateDetails ? (
          <>
            <Field>
              <FieldLabel>Sertifikat nomi</FieldLabel>
              <Input
                value={certificationType}
                placeholder="Masalan, UEFA C, Boxing Coach, NASM CPT"
                onChange={(event) =>
                  setField("certificationType", event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel>Sertifikat raqami</FieldLabel>
              <Input
                value={certificationNumber}
                placeholder="ABC123456"
                onChange={(event) =>
                  setField("certificationNumber", event.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel>Sertifikat fayllari</FieldLabel>
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
                  Fayl yuklash
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
                  JPG, PNG yoki PDF. Har bir fayl maksimum 8MB.
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
                    Kamida bitta sertifikat fayli yuklang.
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
