import React from "react";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash";
import {
  AtSignIcon,
  CameraIcon,
  ChevronRightIcon,
  MailIcon,
  PhoneIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PhoneInput } from "@/components/ui/phone-input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import {
  getAuthErrorMessage,
  getOtpToastDescription,
} from "@/modules/auth/lib/auth-utils";

const MAX_AVATAR_FILE_SIZE = 3 * 1024 * 1024;

const calcCompletionPct = (form) => {
  let pct = 0;
  if (form.avatar?.trim()) pct += 20;
  if (form.firstName?.trim()) pct += 10;
  if (form.lastName?.trim()) pct += 10;
  if (form.bio?.trim()) pct += 15;
  if (form.username?.trim()) pct += 15;
  if (form.email?.trim()) pct += 15;
  if (form.phone?.trim()) pct += 15;
  return pct;
};

const ProfileCompletionBar = ({ form }) => {
  const pct = calcCompletionPct(form);
  if (pct >= 100) return null;
  return (
    <div className="rounded-2xl border bg-primary/5 px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Profil to&apos;ldirilishi</span>
        <span className="font-bold text-primary">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {pct < 50
          ? "Profilingizni to'liq to'ldiring — bu boshqalar sizni topishiga yordam beradi."
          : pct < 80
            ? "Yaxshi boshlang'ich! Yana bir nechta qism to'ldirilmagan."
            : "Deyarli tayyor! Profilingizni yakunlang."}
      </p>
    </div>
  );
};

const validateUsername = (username) => {
  const trimmed = username.trim().replace(/^@+/, "");
  if (!trimmed) return null;
  if (trimmed.length < 3) return "Username kamida 3 ta belgi bo'lishi kerak.";
  if (trimmed.length > 30) return "Username 30 ta belgidan oshmasligi kerak.";
  if (!/^[a-zA-Z0-9._]+$/.test(trimmed))
    return "Username faqat harf, raqam, nuqta va pastki chiziqdan iborat bo'lishi kerak.";
  return null;
};

const createInitialForm = (user) => ({
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  username: user?.username ?? "",
  email: user?.email ?? "",
  phone: user?.phone ?? "",
  bio: user?.bio ?? "",
  avatar: user?.avatar ?? "",
});

const normalizeForm = (form) => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  username: form.username.trim().replace(/^@+/, ""),
  email: form.email.trim(),
  phone: form.phone.trim(),
  bio: form.bio.trim(),
  avatar: form.avatar || "",
});

const imageFileToDataUrl = (file, t) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(t("profile.user.avatarProcessError")));
    reader.readAsDataURL(file);
  });

const resizeImage = async (file, t) => {
  const source = await imageFileToDataUrl(file, t);
  const image = new Image();

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = source;
  });

  const maxEdge = 320;
  const ratio = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.82);
};

const getContactTypes = (t) => ({
  email: {
    label: t("profile.coach.email"),
    changeTitle: t("profile.user.contactChange.emailTitle"),
    placeholder: t("profile.user.contactChange.emailPlaceholder"),
    description: t("profile.user.contactChange.emailDesc"),
    icon: MailIcon,
  },
  phone: {
    label: t("profile.coach.phone"),
    changeTitle: t("profile.user.contactChange.phoneTitle"),
    placeholder: t("profile.user.contactChange.phonePlaceholder"),
    description: t("profile.user.contactChange.phoneDesc"),
    icon: PhoneIcon,
  },
});

const ContactRow = ({ icon: Icon, label, value, onClick, t }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/40"
  >
    <div className="flex size-10 items-center justify-center rounded-full text-muted-foreground">
      <Icon className="size-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate">{value || t("profile.coach.notProvided")}</p>
    </div>
    <ChevronRightIcon className="size-5 text-muted-foreground" />
  </button>
);

export const UserProfileTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const {
    user,
    saveProfile,
    requestEmailChange,
    verifyEmailChange,
    requestPhoneChange,
    verifyPhoneChange,
    isSavingProfile,
    isRequestingContactChange,
    isVerifyingContactChange,
  } = useProfileSettings();
  const fileInputRef = React.useRef(null);
  const initialForm = React.useMemo(() => createInitialForm(user), [user]);
  const [form, setForm] = React.useState(initialForm);
  const [avatarError, setAvatarError] = React.useState("");
  const [contactDrawerOpen, setContactDrawerOpen] = React.useState(false);
  const [otpDrawerOpen, setOtpDrawerOpen] = React.useState(false);
  const [contactType, setContactType] = React.useState("email");
  const [contactValue, setContactValue] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [contactError, setContactError] = React.useState("");
  const [otpError, setOtpError] = React.useState("");
  const [pendingContact, setPendingContact] = React.useState(null);
  const [resendCountdown, setResendCountdown] = React.useState(0);

  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const startResendCountdown = React.useCallback(() => {
    setResendCountdown(60);
  }, []);

  React.useEffect(() => {
    setForm(initialForm);
    setAvatarError("");
  }, [initialForm]);

  const normalizedForm = React.useMemo(() => normalizeForm(form), [form]);
  const normalizedInitialForm = React.useMemo(
    () => normalizeForm(initialForm),
    [initialForm],
  );
  const isDirty = !isEqual(normalizedForm, normalizedInitialForm);
  const usernameError = React.useMemo(
    () => validateUsername(form.username),
    [form.username],
  );
  const displayName =
    `${form.firstName || ""} ${form.lastName || ""}`.trim() || t("common.user", "Foydalanuvchi");
  const initials = `${form.firstName?.[0] || "F"}${form.lastName?.[0] || ""}`
    .trim()
    .toUpperCase();

  const handleChange = React.useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const handleAvatarSelect = React.useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError(t("profile.user.avatarError"));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setAvatarError(t("profile.user.avatarSizeError"));
      event.target.value = "";
      return;
    }

    try {
      const avatar = await resizeImage(file, t);
      setAvatarError("");
      setForm((current) => ({ ...current, avatar }));
    } catch {
      setAvatarError(t("profile.user.avatarProcessError"));
    } finally {
      event.target.value = "";
    }
  }, []);

  const handleSave = React.useCallback(async () => {
    try {
      await saveProfile({
        firstName: normalizedForm.firstName || undefined,
        lastName: normalizedForm.lastName || undefined,
        username: normalizedForm.username || undefined,
        email: embedded ? undefined : normalizedForm.email || undefined,
        phone: embedded ? undefined : normalizedForm.phone || undefined,
        bio: normalizedForm.bio,
        avatar: normalizedForm.avatar || undefined,
      });
      toast.success(t("profile.user.saveSuccess"));
    } catch (error) {
      toast.error(getRequestErrorMessage(error, t("profile.user.saveError")));
    }
  }, [embedded, normalizedForm, saveProfile]);

  const openContactDrawer = React.useCallback(
    (type) => {
      setContactType(type);
      setContactError("");
      setOtpError("");
      setOtpCode("");
      setPendingContact(null);
      setContactValue(
        type === "email" ? normalizedForm.email : normalizedForm.phone,
      );
      setContactDrawerOpen(true);
    },
    [normalizedForm.email, normalizedForm.phone],
  );

  const closeContactDrawers = React.useCallback(() => {
    setContactDrawerOpen(false);
    setOtpDrawerOpen(false);
    setContactError("");
    setOtpError("");
    setOtpCode("");
    setPendingContact(null);
  }, []);

  const handleRequestContactChange = React.useCallback(async () => {
    try {
      setContactError("");

      const responseData =
        contactType === "email"
          ? await requestEmailChange(contactValue)
          : await requestPhoneChange(contactValue);

      setPendingContact({
        type: contactType,
        value: contactValue,
      });
      setContactDrawerOpen(false);
      setOtpDrawerOpen(true);
      startResendCountdown();
      toast.success(responseData?.message || t("profile.user.contactChange.otpTitle"), {
        description: getOtpToastDescription(responseData),
      });
    } catch (error) {
      setContactError(
        getAuthErrorMessage(error, t("profile.user.contactChange.sendError")),
      );
    }
  }, [contactType, contactValue, requestEmailChange, requestPhoneChange]);

  const handleVerifyContactChange = React.useCallback(async () => {
    if (otpCode.trim().length !== 6) {
      setOtpError(t("profile.user.contactChange.otpLengthError"));
      return;
    }

    try {
      setOtpError("");
      const responseData =
        pendingContact?.type === "email"
          ? await verifyEmailChange(otpCode)
          : await verifyPhoneChange(otpCode);

      setOtpDrawerOpen(false);
      setPendingContact(null);
      setOtpCode("");
      toast.success(responseData?.message || t("profile.user.contactChange.verifySuccess"));
    } catch (error) {
      setOtpError(getAuthErrorMessage(error, t("profile.user.contactChange.verifyError")));
    }
  }, [otpCode, pendingContact?.type, verifyEmailChange, verifyPhoneChange]);

  const handleResendOtp = React.useCallback(async () => {
    if (!pendingContact?.value || !pendingContact?.type) {
      return;
    }

    try {
      const responseData =
        pendingContact.type === "email"
          ? await requestEmailChange(pendingContact.value)
          : await requestPhoneChange(pendingContact.value);
      startResendCountdown();
      toast.success(responseData?.message || "OTP code sent again.", {
        description: getOtpToastDescription(responseData),
      });
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("profile.user.contactChange.resendError")));
    }
  }, [pendingContact, requestEmailChange, requestPhoneChange]);

  if (embedded) {
    const contactMeta = getContactTypes(t)[contactType];

    return (
      <>
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto px-3 pb-6 pt-4 sm:px-4 space-y-4">
            <ProfileCompletionBar form={form} />
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative">
                <Avatar className="size-24 border">
                  <AvatarImage src={form.avatar} alt={displayName} />
                  <AvatarFallback className="text-3xl font-semibold">
                    {initials || "F"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full"
                >
                  <CameraIcon className="size-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>
            </div>

            <Card className="py-3 md:py-6">
              <CardContent className="p-3 md:p-6 space-y-4">
                <Field>
                  <FieldLabel>{t("profile.user.firstName")}</FieldLabel>
                  <Input
                    value={form.firstName}
                    placeholder={t("profile.user.firstName")}
                    onChange={(event) =>
                      handleChange("firstName", event.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>{t("profile.user.lastName")}</FieldLabel>
                  <Input
                    value={form.lastName}
                    placeholder={t("profile.user.lastName")}
                    onChange={(event) =>
                      handleChange("lastName", event.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>{t("profile.user.bio")}</FieldLabel>
                  <Textarea
                    rows={4}
                    maxLength={280}
                    value={form.bio}
                    placeholder={t("profile.user.bioPlaceholder")}
                    onChange={(event) =>
                      handleChange("bio", event.target.value)
                    }
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <FieldDescription>
                      {t("profile.user.bioHint")}
                    </FieldDescription>
                    <span>{t("profile.user.bioCount", { current: form.bio.length })}</span>
                  </div>
                </Field>
              </CardContent>
            </Card>

            <Card className="py-6">
              <CardContent className="space-y-4 p-6">
                <p className="text-lg font-medium">{t("profile.username")}</p>
                <Field>
                  <FieldLabel>{t("profile.user.username")}</FieldLabel>
                  <Input
                    value={form.username}
                    placeholder="username"
                    onChange={(event) =>
                      handleChange("username", event.target.value)
                    }
                  />
                  {usernameError ? (
                    <FieldError>{usernameError}</FieldError>
                  ) : null}
                </Field>
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("profile.user.usernameHint")}
                </p>
              </CardContent>
            </Card>

            <Card className="py-6">
              <CardContent className="space-y-4 p-6">
                <p className="text-lg font-medium">{t("profile.user.contacts")}</p>
                <ContactRow
                  icon={PhoneIcon}
                  label={t("profile.coach.phone")}
                  value={user?.phone || t("profile.coach.notProvided")}
                  onClick={() => openContactDrawer("phone")}
                  t={t}
                />
                <ContactRow
                  icon={MailIcon}
                  label={t("profile.coach.email")}
                  value={user?.email || t("profile.coach.notProvided")}
                  onClick={() => openContactDrawer("email")}
                  t={t}
                />
              </CardContent>
            </Card>

            <FieldError>{avatarError}</FieldError>
          </div>

          <DrawerFooter>
            <Button
              type="button"
              disabled={!isDirty || isSavingProfile || Boolean(usernameError)}
              onClick={handleSave}
            >
              {isSavingProfile ? t("profile.general.saving") : t("profile.general.save")}
            </Button>
          </DrawerFooter>
        </div>

        <Drawer
          open={contactDrawerOpen}
          onOpenChange={(open) => {
            setContactDrawerOpen(open);
            if (!open) {
              setContactError("");
            }
          }}
          direction="bottom"
        >
          <DrawerContent side="bottom">
            <DrawerHeader className="px-5 pt-5 text-center items-center">
              <DrawerTitle>{contactMeta.changeTitle}</DrawerTitle>
              <DrawerDescription>{contactMeta.description}</DrawerDescription>
            </DrawerHeader>
            <div className="px-5 pb-2">
              {contactType === "phone" ? (
                <PhoneInput
                  value={contactValue}
                  defaultCountry="UZ"
                  onChange={(value) => setContactValue(value || "")}
                />
              ) : (
                <Input
                  value={contactValue}
                  placeholder={contactMeta.placeholder}
                  onChange={(event) => setContactValue(event.target.value)}
                />
              )}
              <FieldError className="mt-3">{contactError}</FieldError>
            </div>
            <DrawerFooter>
              <Button
                type="button"
                disabled={!contactValue || isRequestingContactChange}
                onClick={handleRequestContactChange}
              >
                {isRequestingContactChange ? t("profile.user.contactChange.sending") : t("profile.user.contactChange.continue")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer
          open={otpDrawerOpen}
          onOpenChange={(open) => {
            setOtpDrawerOpen(open);
            if (!open) {
              setOtpError("");
              setOtpCode("");
            }
          }}
          direction="bottom"
        >
          <DrawerContent side="bottom">
            <DrawerHeader className="px-5 pt-5 text-center items-center">
              <DrawerTitle>{t("profile.user.contactChange.otpTitle")}</DrawerTitle>
              <DrawerDescription>
                {t("profile.user.contactChange.otpSent", { contact: pendingContact?.value || "" })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 px-5 pb-2">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                containerClassName="justify-center"
              >
                <div className="flex items-center justify-center gap-x-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPGroup key={index}>
                      <InputOTPSlot index={index} className="size-12" />
                    </InputOTPGroup>
                  ))}
                </div>
              </InputOTP>
              <div className="flex justify-center flex-col items-center gap-2">
                <FieldError>{otpError}</FieldError>
                <button
                  type="button"
                  disabled={resendCountdown > 0}
                  className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  onClick={handleResendOtp}
                >
                  {resendCountdown > 0
                    ? t("profile.user.contactChange.otpResendIn", {
                        s: resendCountdown,
                      })
                    : t("profile.user.contactChange.otpResend")}
                </button>
              </div>
            </div>
            <DrawerFooter className="px-5 pb-5">
              <Button
                type="button"
                disabled={otpCode.length !== 6 || isVerifyingContactChange}
                onClick={handleVerifyContactChange}
              >
                {isVerifyingContactChange ? t("profile.user.contactChange.verifying") : t("profile.user.contactChange.otpTitle")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={closeContactDrawers}
              >
                {t("profile.general.cancel")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl border-border/60 py-6 shadow-none">
      <CardHeader className="items-center pb-2 text-center">
        <CardTitle className="text-xl font-semibold">{t("profile.tabs.profile")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6 sm:p-8">
        <ProfileCompletionBar form={form} />
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="size-24 rounded-full border border-border/60">
              <AvatarImage src={form.avatar} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-3xl font-black text-primary">
                {initials || "F"}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              size="icon-sm"
              className="absolute bottom-0 right-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <CameraIcon className="size-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          {form.avatar ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleChange("avatar", "")}
            >
              {t("profile.user.avatarRemove")}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel>{t("profile.user.firstName")}</FieldLabel>
            <Input
              value={form.firstName}
              autoComplete="given-name"
              placeholder={t("profile.user.firstName")}
              className="h-12 rounded-full px-5 shadow-none"
              onChange={(event) =>
                handleChange("firstName", event.target.value)
              }
            />
          </Field>
          <Field>
            <FieldLabel>{t("profile.user.lastName")}</FieldLabel>
            <Input
              value={form.lastName}
              autoComplete="family-name"
              placeholder={t("profile.user.lastName")}
              className="h-12 rounded-full px-5 shadow-none"
              onChange={(event) => handleChange("lastName", event.target.value)}
            />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>{t("profile.user.username")}</FieldLabel>
            <Input
              value={form.username}
              autoComplete="username"
              placeholder="johndoe"
              className="h-12 rounded-full px-5 shadow-none"
              onChange={(event) => handleChange("username", event.target.value)}
            />
            {usernameError ? (
              <FieldError>{usernameError}</FieldError>
            ) : null}
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>{t("profile.coach.email")}</FieldLabel>
            <Input
              type="email"
              value={form.email}
              autoComplete="email"
              placeholder="johndoe@gmail.com"
              className="h-12 rounded-full px-5 shadow-none"
              onChange={(event) => handleChange("email", event.target.value)}
            />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>{t("profile.coach.phone")}</FieldLabel>
            <PhoneInput
              value={form.phone}
              defaultCountry="UZ"
              onChange={(value) => handleChange("phone", value)}
              className="[&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-e-full [&_[data-slot=combobox-trigger]]:h-12 [&_[data-slot=combobox-trigger]]:rounded-s-full"
            />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>{t("profile.user.bio")}</FieldLabel>
            <Textarea
              rows={5}
              maxLength={280}
              value={form.bio}
              placeholder={t("profile.user.bioPlaceholder")}
              className="rounded-3xl px-5 py-4 shadow-none"
              onChange={(event) => handleChange("bio", event.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <FieldDescription>
                {t("profile.user.bioHint")}
              </FieldDescription>
              <span>{t("profile.user.bioCount", { current: form.bio.length })}</span>
            </div>
          </Field>
        </div>

        <FieldError>{avatarError}</FieldError>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            disabled={!isDirty || isSavingProfile || Boolean(usernameError)}
            onClick={handleSave}
          >
            {isSavingProfile ? t("profile.general.saving") : t("profile.general.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
