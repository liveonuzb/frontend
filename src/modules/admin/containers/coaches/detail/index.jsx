import React from "react";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router";
import { get, isArray, join, map, size, trim } from "lodash";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
  WalletCardsIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import {
  coachStatusConfig,
  getCoachAvatar,
  getCoachFirstName,
  getCoachLastName,
  marketplaceStatusConfig,
} from "../list/columns.jsx";

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD.MM.YYYY HH:mm") : "-";
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Kelishiladi";
  return `${new Intl.NumberFormat("uz-UZ").format(amount)} so'm`;
};

const getMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    <span className="max-w-[60%] text-right text-sm font-medium">
      {value || "-"}
    </span>
  </div>
);

const Section = ({ title, description, children }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="space-y-4 p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </CardContent>
  </Card>
);

const StatCard = ({ icon: Icon, label, value, hint }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="space-y-3 p-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {label}
        </p>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </CardContent>
  </Card>
);

const EmptyState = ({ children }) => (
  <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

const CoachDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canManageSupport } = useAdminPermissions();

  const { data, isLoading } = useGetQuery({
    url: `/admin/coaches/${id}`,
    queryProps: {
      queryKey: ["admin-coach-detail", id],
      enabled: Boolean(id),
    },
  });

  const detail = get(data, "data.data") ?? get(data, "data") ?? null;
  const coach = get(detail, "coach", {});
  const stats = get(detail, "stats", {});
  const application = get(coach, "application", {});
  const coachStatus = get(coach, "status", "pending");
  const marketplaceStatus = get(coach, "marketplaceStatus", "none");
  const displayName =
    trim(`${getCoachFirstName(coach)} ${getCoachLastName(coach)}`) ||
    get(coach, "displayName", "Murabbiy");
  const specializations = get(application, "specializations", []);
  const languages = get(application, "languages", []);
  const certificates = get(application, "certificateFiles", []);

  const { mutateAsync: patchCoachStatus, isPending: isUpdatingStatus } =
    usePatchQuery({
      queryKey: ["admin-coach-detail"],
      listKey: ["admin", "users"],
    });
  const {
    mutateAsync: patchMarketplaceStatus,
    isPending: isUpdatingMarketplace,
  } = usePatchQuery({
    queryKey: ["admin-coach-detail"],
    listKey: ["admin", "users"],
  });

  const handleClose = React.useCallback(() => {
    navigate("/admin/coaches/list");
  }, [navigate]);

  const handleStatusUpdate = React.useCallback(
    async (status) => {
      if (!canManageSupport || !id) return;

      try {
        await patchCoachStatus({
          url: `/admin/coaches/${id}/status`,
          attributes: { status },
        });
        toast.success(
          status === "approved"
            ? "Murabbiy tasdiqlandi"
            : "Murabbiy rad etildi",
        );
      } catch (error) {
        toast.error(getMessage(error, "Coach holatini yangilab bo'lmadi"));
      }
    },
    [canManageSupport, id, patchCoachStatus],
  );

  const handleMarketplaceUpdate = React.useCallback(
    async (status, successText) => {
      if (!canManageSupport || !id) return;

      try {
        await patchMarketplaceStatus({
          url: `/admin/coaches/${id}/marketplace-status`,
          attributes: { status },
        });
        toast.success(successText);
      } catch (error) {
        toast.error(
          getMessage(error, "Marketplace holatini yangilab bo'lmadi"),
        );
      }
    },
    [canManageSupport, id, patchMarketplaceStatus],
  );

  const actionPending = isUpdatingStatus || isUpdatingMarketplace;
  const statusConfig = get(
    coachStatusConfig,
    coachStatus,
    coachStatusConfig.pending,
  );
  const marketplaceConfig = get(
    marketplaceStatusConfig,
    marketplaceStatus,
    marketplaceStatusConfig.none,
  );

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && handleClose()}
      direction="bottom"
    >
      <DrawerContent className="mx-auto max-h-[92vh] data-[vaul-drawer-direction=bottom]:md:max-w-5xl">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader className="border-b">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 border border-border">
                  <AvatarImage src={getCoachAvatar(coach)} />
                  <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                    {get(displayName, "[0]", "M")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DrawerTitle className="text-left text-2xl font-bold">
                    {isLoading ? "Murabbiy ma'lumotlari" : displayName}
                  </DrawerTitle>
                  <DrawerDescription className="mt-1 flex flex-wrap items-center gap-2 text-left">
                    {get(coach, "email") ||
                      get(coach, "phone") ||
                      "Kontakt yo'q"}
                    {id ? (
                      <Badge variant="secondary">
                        ID: {String(id).slice(0, 8)}
                      </Badge>
                    ) : null}
                  </DrawerDescription>
                </div>
              </div>
              {!isLoading ? (
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      get(statusConfig, "className"),
                    )}
                  >
                    {get(statusConfig, "label")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      get(marketplaceConfig, "className"),
                    )}
                  >
                    {get(marketplaceConfig, "label")}
                  </Badge>
                </div>
              ) : null}
            </div>
          </DrawerHeader>

          {isLoading ? (
            <div className="flex min-h-96 items-center justify-center">
              <Spinner className="size-8 text-muted-foreground" />
            </div>
          ) : (
            <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
              <div className="grid gap-3 md:grid-cols-4">
                <StatCard
                  icon={UsersIcon}
                  label="Aktiv mijozlar"
                  value={get(stats, "activeClients", 0)}
                  hint={`${get(stats, "totalClients", 0)} jami mijoz`}
                />
                <StatCard
                  icon={WalletCardsIcon}
                  label="Daromad"
                  value={formatMoney(get(stats, "totalRevenue", 0))}
                  hint={`${get(stats, "paymentCount", 0)} to'lov`}
                />
                <StatCard
                  icon={StarIcon}
                  label="Reyting"
                  value={get(stats, "averageRating") ?? "-"}
                  hint={`${get(stats, "reviewCount", 0)} review`}
                />
                <StatCard
                  icon={BookOpenIcon}
                  label="Kontent"
                  value={
                    get(stats, "mealPlanTemplateCount", 0) +
                    get(stats, "workoutTemplateCount", 0) +
                    get(stats, "courseCount", 0)
                  }
                  hint="Template va kurslar"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  <Section
                    title="Ariza ma'lumotlari"
                    description="Coach onboarding va marketplace uchun yuborilgan asosiy ma'lumotlar."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <InfoRow
                          label="Shahar"
                          value={get(application, "city")}
                        />
                        <InfoRow
                          label="Ish turi"
                          value={get(application, "workMode")}
                        />
                        <InfoRow
                          label="Ish joyi"
                          value={get(application, "workplace")}
                        />
                        <InfoRow
                          label="Haftalik soat"
                          value={get(application, "weeklyHours")}
                        />
                      </div>
                      <div>
                        <InfoRow
                          label="Narx"
                          value={
                            get(application, "monthlyPrice")
                              ? formatMoney(get(application, "monthlyPrice"))
                              : get(application, "minMonthlyPrice") ||
                                  get(application, "maxMonthlyPrice")
                                ? `${formatMoney(get(application, "minMonthlyPrice"))} - ${formatMoney(get(application, "maxMonthlyPrice"))}`
                                : null
                          }
                        />
                        <InfoRow
                          label="Sertifikat turi"
                          value={get(application, "certificationType")}
                        />
                        <InfoRow
                          label="Sertifikat raqami"
                          value={get(application, "certificationNumber")}
                        />
                        <InfoRow
                          label="Yuborilgan"
                          value={formatDate(get(application, "submittedAt"))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">
                          Mutaxassisliklar
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {size(specializations) ? (
                            map(specializations, (item) => (
                              <Badge key={item} variant="secondary">
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Kiritilmagan
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">
                          Tillar
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {size(languages) ? (
                            map(languages, (item) => (
                              <Badge key={item} variant="outline">
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Kiritilmagan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6">
                      {get(application, "bio") ||
                        get(coach, "bio") ||
                        "Bio kiritilmagan."}
                    </div>
                  </Section>

                  <Section
                    title="Mijozlar"
                    description="Oxirgi yangilangan mijozlar."
                  >
                    {size(get(detail, "clients", [])) ? (
                      <div className="divide-y rounded-lg border">
                        {map(get(detail, "clients", []), (item) => (
                          <div
                            key={get(item, "id")}
                            className="flex items-center justify-between gap-3 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {get(item, "client.displayName")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {get(item, "status")} -{" "}
                                {get(item, "lifecycleStage")}
                              </p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <p>{formatMoney(get(item, "agreedAmount"))}</p>
                              <p>{formatDate(get(item, "lastPaymentAt"))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState>Mijozlar hali yo'q.</EmptyState>
                    )}
                  </Section>

                  <Section title="Reviewlar">
                    {size(get(detail, "reviews", [])) ? (
                      <div className="space-y-3">
                        {map(get(detail, "reviews", []), (review) => (
                          <div
                            key={get(review, "id")}
                            className="rounded-lg border p-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                {get(review, "client.displayName")}
                              </p>
                              <Badge variant="secondary">
                                {get(review, "rating")} / 5
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {get(review, "comment") || "Izoh yo'q"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState>Reviewlar hali yo'q.</EmptyState>
                    )}
                  </Section>
                </div>

                <div className="space-y-5">
                  <Section title="Admin actionlar">
                    <div className="flex flex-col gap-2">
                      {coachStatus === "pending" ? (
                        <>
                          <Button
                            disabled={!canManageSupport || actionPending}
                            onClick={() => handleStatusUpdate("approved")}
                          >
                            <CheckCircleIcon className="size-4" />
                            Tasdiqlash
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            disabled={!canManageSupport || actionPending}
                            onClick={() => handleStatusUpdate("rejected")}
                          >
                            <XCircleIcon className="size-4" />
                            Rad etish
                          </Button>
                        </>
                      ) : null}
                      {coachStatus === "approved" ? (
                        <>
                          <Button
                            disabled={!canManageSupport || actionPending}
                            onClick={() =>
                              handleMarketplaceUpdate(
                                "approved",
                                "Coach marketplacega chiqarildi",
                              )
                            }
                          >
                            <BadgeCheckIcon className="size-4" />
                            Marketplacega chiqarish
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            disabled={!canManageSupport || actionPending}
                            onClick={() =>
                              handleMarketplaceUpdate(
                                "rejected",
                                "Marketplace arizasi rad etildi",
                              )
                            }
                          >
                            <XCircleIcon className="size-4" />
                            Marketplace rad etish
                          </Button>
                          <Button
                            variant="outline"
                            disabled={!canManageSupport || actionPending}
                            onClick={() =>
                              handleMarketplaceUpdate(
                                "none",
                                "Coach marketplacedan olib tashlandi",
                              )
                            }
                          >
                            Marketplacedan olish
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </Section>

                  <Section title="Marketplace">
                    <InfoRow
                      label="Listing xohishi"
                      value={
                        get(application, "wantsMarketplaceListing")
                          ? "Ha"
                          : "Yo'q"
                      }
                    />
                    <InfoRow
                      label="So'rov sanasi"
                      value={formatDate(
                        get(application, "marketplaceRequestedAt"),
                      )}
                    />
                    <InfoRow
                      label="Review sanasi"
                      value={formatDate(
                        get(application, "marketplaceReviewedAt"),
                      )}
                    />
                    <InfoRow
                      label="Izoh"
                      value={get(application, "marketplaceReviewNote")}
                    />
                  </Section>

                  <Section title="Sertifikatlar">
                    {size(certificates) ? (
                      <div className="space-y-2">
                        {map(certificates, (file, index) => (
                          <a
                            key={`${file}-${index}`}
                            href={file}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                          >
                            <ShieldCheckIcon className="size-4 text-primary" />
                            Sertifikat {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <EmptyState>Sertifikat fayllari mavjud emas.</EmptyState>
                    )}
                  </Section>

                  <Section title="So'nggi sessiyalar">
                    {size(get(detail, "sessions", [])) ? (
                      <div className="space-y-2">
                        {map(get(detail, "sessions", []), (session) => (
                          <div
                            key={get(session, "id")}
                            className="rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-2">
                              <CalendarDaysIcon className="size-4 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                {get(session, "title")}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {get(session, "client.displayName")} -{" "}
                              {formatDate(get(session, "sessionDate"))}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState>Sessiyalar yo'q.</EmptyState>
                    )}
                  </Section>
                </div>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CoachDetail;
