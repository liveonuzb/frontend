import {
  concat,
  filter,
  get,
  includes,
  isEmpty,
  map,
  size,
  trim,
} from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, UserPlusIcon } from "lucide-react";

export const GroupSelectionDrawer = ({ 
  open, 
  onOpenChange, 
  groups, 
  selectedGroupId, 
  setSelectedGroupId, 
  onConfirm, 
  selectedCount 
}) => {
  const { t } = useTranslation();
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t("coach.clients.drawers.groupSelection.title")}</DrawerTitle>
          <DrawerDescription>
            {t("coach.clients.drawers.groupSelection.description", { count: selectedCount })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="coach-group-selection">{t("coach.clients.drawers.groupSelection.label")}</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="coach-group-selection" className="h-12 rounded-2xl">
                <SelectValue placeholder={t("coach.clients.drawers.groupSelection.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <UserPlusIcon className="size-4 text-primary" />
                    <span>{t("coach.clients.drawers.groupSelection.createNew")}</span>
                  </div>
                </SelectItem>
                {map(groups, (group) => (
                  <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={onConfirm} disabled={!selectedGroupId}>{t("coach.clients.drawers.groupSelection.submit")}</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("coach.clients.drawers.groupSelection.cancel")}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const CreateGroupDrawer = ({ 
  open, 
  onOpenChange, 
  name, 
  setName, 
  desc, 
  setDesc, 
  onNext 
}) => {
  const { t } = useTranslation();
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t("coach.clients.drawers.createGroup.title")}</DrawerTitle>
          <DrawerDescription>{t("coach.clients.drawers.createGroup.description")}</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="new-group-name">{t("coach.clients.drawers.createGroup.nameLabel")}</Label>
            <Input id="new-group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("coach.clients.drawers.createGroup.namePlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-group-desc">{t("coach.clients.drawers.createGroup.descLabel")}</Label>
            <Textarea id="new-group-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("coach.clients.drawers.createGroup.descPlaceholder")} />
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={onNext} disabled={isEmpty(trim(name))}>
            {t("coach.clients.drawers.createGroup.submit")}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("coach.clients.drawers.createGroup.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const MemberSelectionDrawer = ({ 
  open, 
  onOpenChange, 
  search, 
  setSearch, 
  filteredMembers, 
  selectedIds, 
  setSelectedIds, 
  onConfirm, 
  isSubmitting 
}) => {
  const { t } = useTranslation();
  const toggleMember = (id) => {
    setSelectedIds((prev) =>
      includes(prev, id) ? filter(prev, (i) => i !== id) : concat(prev, id),
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto flex h-[80dvh] flex-col data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t("coach.clients.drawers.memberSelection.title")}</DrawerTitle>
          <DrawerDescription>{t("coach.clients.drawers.memberSelection.description")}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={t("coach.clients.drawers.memberSelection.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 py-4">
              {map(filteredMembers, (member) => {
                const id = get(member, "id");
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-2xl border p-3"
                    onClick={() => toggleMember(id)}
                  >
                    <Checkbox checked={includes(selectedIds, id)} />
                    <Avatar className="size-8">
                      <AvatarImage src={get(member, "avatar")} />
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{get(member, "name")}</p>
                    <p className="truncate text-xs text-muted-foreground">{get(member, "email") || get(member, "phone")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <DrawerFooter className="border-t">
          <Button onClick={onConfirm} disabled={isSubmitting || isEmpty(selectedIds)}>
            {isSubmitting 
              ? t("coach.clients.drawers.memberSelection.submitting") 
              : t("coach.clients.drawers.memberSelection.submit", { count: size(selectedIds) })}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("coach.clients.drawers.memberSelection.back")}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
