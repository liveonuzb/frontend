import React from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ACHIEVEMENT_CATEGORY_OPTIONS,
  ACHIEVEMENT_METRIC_OPTIONS,
} from "./api";

const AchievementFormDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  formData,
  onFieldChange,
  onSubmit,
  isSubmitting,
  isLoading = false,
  submitLabel,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="right">
    <DrawerContent>
      <form
        className="flex h-full flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex-1 space-y-5 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Ma&apos;lumot yuklanmoqda...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="achievement-key">Key</Label>
                  <Input
                    id="achievement-key"
                    value={formData.key}
                    onChange={(event) => onFieldChange("key", event.target.value)}
                    placeholder="meal_1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement-name">Nomi</Label>
                  <Input
                    id="achievement-name"
                    value={formData.name}
                    onChange={(event) => onFieldChange("name", event.target.value)}
                    placeholder="Birinchi taom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement-description">Tavsif</Label>
                <Textarea
                  id="achievement-description"
                  value={formData.description}
                  onChange={(event) =>
                    onFieldChange("description", event.target.value)
                  }
                  placeholder="Achievement tavsifi"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="achievement-icon">Icon</Label>
                  <Input
                    id="achievement-icon"
                    value={formData.icon}
                    onChange={(event) => onFieldChange("icon", event.target.value)}
                    placeholder="🏆"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategoriya</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => onFieldChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACHIEVEMENT_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select
                    value={formData.metric}
                    onValueChange={(value) => onFieldChange("metric", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Metricni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACHIEVEMENT_METRIC_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="achievement-threshold">Threshold</Label>
                  <Input
                    id="achievement-threshold"
                    type="number"
                    min="1"
                    value={formData.threshold}
                    onChange={(event) =>
                      onFieldChange("threshold", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement-xp-reward">XP reward</Label>
                  <Input
                    id="achievement-xp-reward"
                    type="number"
                    min="0"
                    value={formData.xpReward}
                    onChange={(event) =>
                      onFieldChange("xpReward", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement-sort-order">Sort order</Label>
                  <Input
                    id="achievement-sort-order"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(event) =>
                      onFieldChange("sortOrder", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div>
                  <p className="font-medium">Aktiv holat</p>
                  <p className="text-sm text-muted-foreground">
                    Ochiq achievementlar foydalanuvchilarda progress yig&apos;adi.
                  </p>
                </div>
                <Switch
                  checked={Boolean(formData.isActive)}
                  onCheckedChange={(checked) =>
                    onFieldChange("isActive", checked)
                  }
                />
              </div>
            </>
          )}
        </DrawerBody>

        <DrawerFooter className="border-t">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Saqlanmoqda..." : submitLabel}
            </Button>
          </div>
        </DrawerFooter>
      </form>
    </DrawerContent>
  </Drawer>
);

export default AchievementFormDrawer;
