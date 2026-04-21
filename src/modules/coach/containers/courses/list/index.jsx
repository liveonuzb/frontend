import React from "react";
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit3Icon,
  GlobeIcon,
  Link2OffIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbStore } from "@/store";
import {
  EmptyState,
  ErrorState,
  ListHeader,
  LoadingSkeleton,
  RefreshButton,
} from "@/modules/coach/components/data-grid-helpers";
import {
  useCoachCourses,
  useCoachCoursesMutations,
} from "@/modules/coach/lib/hooks";
import CourseFormDrawer from "../components/CourseFormDrawer.jsx";
import CourseGroupDrawer from "../components/CourseGroupDrawer.jsx";

const DEFAULT_META = {
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 1,
};

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("uz-UZ")} so'm`;

const extractErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || error?.message || fallback;
};

const resolveGroupBadgeVariant = (group) => {
  if (!group) {
    return "outline";
  }

  if (group.status === "ACTIVE") {
    return "default";
  }

  if (group.status === "ERROR") {
    return "destructive";
  }

  return "secondary";
};

const resolveVisibleStats = (courses = []) => ({
  published: courses.filter((course) => course.isPublished).length,
  linked: courses.filter((course) => Boolean(course.group)).length,
  autoApproval: courses.filter((course) => course.autoApprovalEnabled).length,
});

const CoursesListPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [groupStatus, setGroupStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [formState, setFormState] = React.useState({
    open: false,
    mode: "create",
    course: null,
  });
  const [groupTarget, setGroupTarget] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(() => {
    const params = {
      page,
      pageSize: 12,
      sortBy: "sortOrder",
      sortDir: "asc",
    };

    if (deferredSearch.trim()) {
      params.q = deferredSearch.trim();
    }

    if (status !== "all") {
      params.status = status;
    }

    if (groupStatus !== "all") {
      params.groupStatus = groupStatus;
    }

    return params;
  }, [deferredSearch, groupStatus, page, status]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useCoachCourses(queryParams);
  const mutations = useCoachCoursesMutations();

  const courses = data?.data?.data ?? [];
  const meta = data?.data?.meta ?? DEFAULT_META;
  const stats = React.useMemo(() => resolveVisibleStats(courses), [courses]);

  const isMutating =
    mutations.isMutating ||
    mutations.publishMutation.isPending ||
    mutations.unpublishMutation.isPending ||
    mutations.connectGroupMutation.isPending ||
    mutations.disconnectGroupMutation.isPending ||
    mutations.refreshGroupMutation.isPending;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/courses", title: "Kurslar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const totalPages = meta?.totalPages || 1;

    if (page > totalPages) {
      React.startTransition(() => {
        setPage(totalPages);
      });
    }
  }, [meta?.totalPages, page]);

  const handleSaveCourse = async (payload) => {
    try {
      if (formState.mode === "edit" && formState.course) {
        await mutations.updateResource(formState.course.id, payload);
        toast.success("Kurs yangilandi");
      } else {
        await mutations.createResource(payload);
        toast.success("Yangi kurs yaratildi");
      }

      setFormState({ open: false, mode: "create", course: null });
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, "Kursni saqlab bo'lmadi"));
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      if (course.isPublished) {
        await mutations.unpublishCourse(course.id);
        toast.success("Kurs draft holatga qaytdi");
      } else {
        await mutations.publishCourse(course.id);
        toast.success("Kurs publish qilindi");
      }
    } catch (publishError) {
      toast.error(extractErrorMessage(publishError, "Publish holatini o'zgartirib bo'lmadi"));
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await mutations.removeResource(deleteTarget.id);
      toast.success("Kurs o'chirildi");
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError, "Kursni o'chirib bo'lmadi"));
    }
  };

  const handleGroupSubmit = async (payload) => {
    if (!groupTarget) {
      return;
    }

    try {
      await mutations.connectCourseGroup(groupTarget.id, payload);
      toast.success("Telegram group ulanib yangilandi");
      setGroupTarget(null);
    } catch (groupError) {
      toast.error(extractErrorMessage(groupError, "Telegram groupni ulab bo'lmadi"));
    }
  };

  const handleGroupRefresh = async () => {
    if (!groupTarget) {
      return;
    }

    try {
      await mutations.refreshCourseGroupAdmin(groupTarget.id);
      toast.success("Telegram group admin holati yangilandi");
    } catch (refreshError) {
      toast.error(extractErrorMessage(refreshError, "Admin holatini yangilab bo'lmadi"));
    }
  };

  const handleGroupDisconnect = async () => {
    if (!groupTarget) {
      return;
    }

    try {
      await mutations.disconnectCourseGroup(groupTarget.id);
      toast.success("Telegram group uzildi");
      setGroupTarget(null);
    } catch (disconnectError) {
      toast.error(extractErrorMessage(disconnectError, "Telegram groupni uzib bo'lmadi"));
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Kurslarni yuklab bo'lmadi"
        description={extractErrorMessage(
          error,
          "Keyinroq qayta urinib ko'ring.",
        )}
      />
    );
  }

  return (
    <PageTransition className="space-y-4">
      <ListHeader
        eyebrow="Commerce"
        title="Kurslar"
        description="Coach course catalog, price mapping va Telegram group ulanishlari shu yerda boshqariladi."
        actions={[
          {
            key: "refresh",
            label: isFetching ? "Yangilanmoqda..." : "Yangilash",
            icon: RotateCcwIcon,
            variant: "outline",
            onClick: () => refetch(),
            disabled: isFetching,
          },
          {
            key: "create",
            label: "Yangi kurs",
            icon: PlusIcon,
            onClick: () =>
              setFormState({ open: true, mode: "create", course: null }),
          },
        ]}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-3 xl:max-w-3xl xl:flex-1">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                React.startTransition(() => {
                  setPage(1);
                });
              }}
              placeholder="Kurs nomi bo'yicha qidirish"
            />
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                React.startTransition(() => {
                  setPage(1);
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={groupStatus}
              onValueChange={(value) => {
                setGroupStatus(value);
                React.startTransition(() => {
                  setPage(1);
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Group status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha group holatlari</SelectItem>
                <SelectItem value="linked">Linked</SelectItem>
                <SelectItem value="unlinked">Unlinked</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{meta.total} ta kurs</Badge>
            <Badge variant="outline">{stats.published} ta published</Badge>
            <Badge variant="outline">{stats.linked} ta linked</Badge>
            <Badge variant="outline">{stats.autoApproval} ta auto approval</Badge>
          </div>
        </div>
      </ListHeader>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="Kurslar hali yo'q"
          description="Birinchi course listingni yarating va Telegram groupni ulang."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-[2rem] border border-border/60 bg-card/60 p-5 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{course.title}</h2>
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant={resolveGroupBadgeVariant(course.group)}>
                      {course.group ? course.group.status : "UNLINKED"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(course.price)} · {course.accessDurationDays} kun
                    access
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() =>
                        setFormState({ open: true, mode: "edit", course })
                      }
                    >
                      <Edit3Icon className="size-4" />
                      Tahrirlash
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupTarget(course)}>
                      <LinkIcon className="size-4" />
                      Telegram group
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleTogglePublish(course)}>
                      <GlobeIcon className="size-4" />
                      {course.isPublished ? "Draftga qaytarish" : "Publish qilish"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(course)}
                    >
                      <Trash2Icon className="size-4" />
                      O&apos;chirish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                {course.description || "Tavsif kiritilmagan."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-3 py-1">
                  Faol a&apos;zolar: {course.activeMembersCount || 0}
                </span>
                <span className="rounded-full bg-muted px-3 py-1">
                  Auto approval: {course.autoApprovalEnabled ? "On" : "Off"}
                </span>
                <span className="rounded-full bg-muted px-3 py-1">
                  Payment:{" "}
                  {course.paymentMethods?.length
                    ? course.paymentMethods.join(", ")
                    : "Kiritilmagan"}
                </span>
              </div>

              {course.learningOutcomes?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.learningOutcomes.slice(0, 3).map((outcome) => (
                    <Badge key={outcome} variant="secondary">
                      {outcome}
                    </Badge>
                  ))}
                  {course.learningOutcomes.length > 3 ? (
                    <Badge variant="outline">
                      +{course.learningOutcomes.length - 3}
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-muted p-2">
                    {course.group ? (
                      <LinkIcon className="size-4 text-muted-foreground" />
                    ) : (
                      <Link2OffIcon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {course.group?.title || "Telegram group ulanmagan"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.group
                        ? `${course.group.chatId} · ${course.group.inviteLinkPolicy}`
                        : "Approve oqimi ishlashi uchun group ulanishi kerak."}
                    </p>
                    {course.group?.lastError ? (
                      <p className="mt-2 text-sm text-destructive">
                        {course.group.lastError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFormState({ open: true, mode: "edit", course })
                  }
                >
                  <Edit3Icon className="size-4" />
                  Tahrirlash
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setGroupTarget(course)}
                >
                  <LinkIcon className="size-4" />
                  Telegram group
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleTogglePublish(course)}
                >
                  <GlobeIcon className="size-4" />
                  {course.isPublished ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-card/50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {meta.page} / {meta.totalPages} sahifa · {meta.total} ta kurs
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() =>
              React.startTransition(() => {
                setPage((current) => Math.max(1, current - 1));
              })
            }
          >
            <ChevronLeftIcon className="size-4" />
            Oldingi
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() =>
              React.startTransition(() => {
                setPage((current) => current + 1);
              })
            }
          >
            Keyingi
            <ChevronRightIcon className="size-4" />
          </Button>
          <RefreshButton isLoading={isFetching} onRefresh={() => refetch()} />
        </div>
      </div>

      <CourseFormDrawer
        open={formState.open}
        mode={formState.mode}
        course={formState.course}
        onOpenChange={(open) =>
          setFormState((current) =>
            open ? current : { open: false, mode: "create", course: null },
          )
        }
        onSubmit={handleSaveCourse}
        isSubmitting={
          mutations.createMutation.isPending || mutations.updateMutation.isPending
        }
      />

      <CourseGroupDrawer
        open={Boolean(groupTarget)}
        course={groupTarget}
        onOpenChange={(open) => {
          if (!open) {
            setGroupTarget(null);
          }
        }}
        onSubmit={handleGroupSubmit}
        onRefresh={handleGroupRefresh}
        onDisconnect={handleGroupDisconnect}
        isSubmitting={mutations.connectGroupMutation.isPending}
        isRefreshing={mutations.refreshGroupMutation.isPending}
        isDisconnecting={mutations.disconnectGroupMutation.isPending}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kursni o&apos;chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title
                ? `${deleteTarget.title} butunlay o'chiriladi.`
                : "Kurs butunlay o'chiriladi."}{" "}
              Faol approved purchase bo&apos;lsa backend bu actionni bloklaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutations.removeMutation.isPending || isMutating}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteCourse();
              }}
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default CoursesListPage;
