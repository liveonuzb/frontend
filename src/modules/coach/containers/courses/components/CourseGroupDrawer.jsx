import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const groupSchema = z.object({
  chatId: z
    .string()
    .trim()
    .min(1, "Telegram chat id yoki @username kiriting")
    .regex(
      /^(@[A-Za-z0-9_]{5,}|-?\d+)$/,
      "Telegram numeric chat id yoki @username kiriting",
    ),
  inviteLinkPolicy: z.enum(["per_purchase", "reusable"]),
});

const getDefaultValues = (course) => ({
  chatId: course?.group?.chatId ?? "",
  inviteLinkPolicy: course?.group?.inviteLinkPolicy ?? "per_purchase",
});

const labelByPolicy = {
  per_purchase: "Har purchase uchun alohida link",
  reusable: "Bitta reusable link",
};

const CourseGroupDrawer = ({
  open,
  course,
  onOpenChange,
  onSubmit,
  onRefresh,
  onDisconnect,
  isSubmitting = false,
  isRefreshing = false,
  isDisconnecting = false,
}) => {
  const form = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: getDefaultValues(course),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(course));
    }
  }, [course, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      chatId: values.chatId.trim(),
      inviteLinkPolicy: values.inviteLinkPolicy,
    });
  });

  const group = course?.group;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Telegram group ulash</DrawerTitle>
          <DrawerDescription>
            Bot admin tekshiruvi, invite link policy va reconnect flow shu yerda.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="coach-course-group-form"
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DrawerBody className="space-y-6">
              <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={group ? "default" : "outline"}>
                    {group ? "Linked" : "Ulanmagan"}
                  </Badge>
                  {group?.status ? <Badge variant="outline">{group.status}</Badge> : null}
                </div>
                <h3 className="mt-3 text-base font-semibold">
                  {course?.title || "Kurs"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group?.title
                    ? `${group.title} (${group.chatId})`
                    : "Bot invite yuborishi uchun groupni ulang."}
                </p>
                {group?.lastError ? (
                  <p className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {group.lastError}
                  </p>
                ) : null}
                {group ? (
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <span>
                      Invite policy:{" "}
                      {labelByPolicy[group.inviteLinkPolicy] || group.inviteLinkPolicy}
                    </span>
                    <span>Bot invite: {group.botCanInvite ? "Yes" : "No"}</span>
                    <span>Bot restrict: {group.botCanRestrict ? "Yes" : "No"}</span>
                    <span>
                      So&apos;nggi sync:{" "}
                      {group.lastSyncedAt
                        ? new Date(group.lastSyncedAt).toLocaleString("uz-UZ")
                        : "—"}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="chatId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat ID yoki @username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="@my_private_group yoki -1001234567890"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Public group uchun `@username`, private supergroup uchun
                        to&apos;liq `-100...` chat id kiriting. Bot avval guruhga
                        qoshilib admin bolgan bolishi kerak.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inviteLinkPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invite link policy</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="per_purchase">
                            Har purchase uchun alohida link
                          </SelectItem>
                          <SelectItem value="reusable">
                            Reusable invite link
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Talablar</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Bot group ichida bolishi kerak</li>
                  <li>Bot admin bolishi kerak</li>
                  <li>`Invite users` va `Ban/Remove users` permission yoqilgan bolishi kerak</li>
                  <li>Group supergroupga aylangan bo&apos;lsa yangi `-100...` id ishlatiladi</li>
                </ul>
              </div>
            </DrawerBody>

            <DrawerFooter>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isSubmitting} className="sm:flex-1">
                  {group ? "Reconnect / update" : "Ulash"}
                </Button>
                {group ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isRefreshing}
                    onClick={() => void onRefresh()}
                    className="sm:flex-1"
                  >
                    {isRefreshing ? "Tekshirilmoqda..." : "Admin refresh"}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {group ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isDisconnecting}
                    onClick={() => void onDisconnect()}
                    className="sm:flex-1"
                  >
                    {isDisconnecting ? "Uzilmoqda..." : "Disconnect"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="sm:flex-1"
                >
                  Yopish
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
};

export default CourseGroupDrawer;
