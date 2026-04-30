import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import MealPlanBuilder from "@/components/meal-plan-builder/index.jsx";
import {
  ArchiveIcon,
  CopyIcon,
  PauseIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import ActionDrawer from "./action-drawer.jsx";
import AIGenerator from "./ai-generator";
import GoalRecalculationDrawer from "./goal-recalculation-drawer.jsx";
import InlineScanReviewDrawer from "./inline-scan-review-drawer.jsx";
import MealTransferDrawer from "./meal-transfer-drawer.jsx";
import {
  NutritionDrawerBody,
  NutritionDrawerContent,
} from "./nutrition-drawer-layout.jsx";
import NutritionFilterDrawer from "./nutrition-filter-drawer.jsx";
import PlansDrawer from "./plans-drawer.jsx";
import SavedMealsDrawer from "./saved-meals-drawer.jsx";
import { ShoppingList } from "./shopping-list.jsx";
import TemplateLibraryDrawer from "./template-library-drawer.jsx";

const getDrawerControl = (open, onOpenChange) => ({ open, onOpenChange });

export default function NutritionDrawers({
  activeFilterCount,
  addMealAction,
  addMealsBatchAction,
  builderInitialData,
  calorieRange,
  clearNutritionFilters,
  currentPlan,
  dateKey,
  duplicateMealPrompt,
  effectiveGoals,
  filterDateRange,
  getPlanSourceMeta,
  getPlanStatusMeta,
  groupDraftCount,
  handleActivatePlan,
  handleAiGenerated,
  handleApplyCoachUpdate,
  handleArchiveCurrentPlan,
  handleConfirmAllInlineScans,
  handleConfirmInlineScan,
  handleConfirmMealTransfer,
  handleDuplicateCurrentPlan,
  handleInlineCameraCapture,
  handleOpenAiGenerator,
  handleOpenBuilderManual,
  handleOpenPlanActions,
  handleOpenTemplateLibrary,
  handleRemovePlanFromCard,
  handleRemoveScan,
  handleSaveBuilder,
  handleSubmitPlanMeta,
  handleTemplateSelected,
  isActionDrawerOpen,
  isAIOpen,
  isApplyingCoachUpdate,
  isArchivingPlan,
  isBuilderOpen,
  isCancelPlanOpen,
  isCurrentPlanCoachAssigned,
  isCurrentPlanUpdateAvailable,
  isDuplicatingPlan,
  isFilterDrawerOpen,
  isGoalWizardOpen,
  isMealPlanFetching,
  isMealPlanLoading,
  isOnline,
  isPlanMetaOpen,
  isPlansDrawerOpen,
  isSavedMealsOpen,
  isSavingDraft,
  isSavingInlineScan,
  isShoppingOpen,
  isTemplateLibraryOpen,
  mealSearch,
  mealTransferContext,
  onCreateManualPlan,
  onOpenPlanMetaEdit,
  orderedPlans,
  pausePlan,
  planInsightsMap,
  planMetaDescription,
  planMetaMode,
  planMetaName,
  planMetaShouldOpenBuilder,
  removePlan,
  selectedDay,
  selectedMealTypeForAdd,
  selectedScan,
  setBuilderInitialData,
  setCalorieRange,
  setDuplicateMealPrompt,
  setFilterDateRange,
  setIsActionDrawerOpen,
  setIsAIOpen,
  setIsBuilderOpen,
  setIsCancelPlanOpen,
  setIsFilterDrawerOpen,
  setIsGoalWizardOpen,
  setIsPlanMetaOpen,
  setIsPlansDrawerOpen,
  setIsSavedMealsOpen,
  setIsShoppingOpen,
  setIsTemplateLibraryOpen,
  setMealSearch,
  setMealTransferContext,
  setPlanMetaDescription,
  setPlanMetaName,
  setSelectedPlanId,
  setSelectedScanId,
  setSourceFilters,
  sourceFilters,
}) {
  return (
    <>
      <MealPlanBuilder
        {...getDrawerControl(isBuilderOpen, (val) => {
          setIsBuilderOpen(val);
          if (!val) setBuilderInitialData(null);
        })}
        initialData={builderInitialData || currentPlan?.weeklyKanban || {}}
        selectedDay={selectedDay}
        onSave={handleSaveBuilder}
        onClose={() => {
          setIsBuilderOpen(false);
          setBuilderInitialData(null);
        }}
      />
      <ShoppingList
        {...getDrawerControl(isShoppingOpen, setIsShoppingOpen)}
        plan={currentPlan}
        isLoading={isMealPlanLoading}
        isFetching={isMealPlanFetching}
      />

      <PlansDrawer
        {...getDrawerControl(isPlansDrawerOpen, setIsPlansDrawerOpen)}
        isLoading={isMealPlanLoading}
        orderedPlans={orderedPlans}
        currentPlan={currentPlan}
        planInsightsMap={planInsightsMap}
        getPlanStatusMeta={getPlanStatusMeta}
        getPlanSourceMeta={getPlanSourceMeta}
        onActivatePlan={handleActivatePlan}
        onOpenPlanActions={handleOpenPlanActions}
        onRemovePlan={handleRemovePlanFromCard}
        onSelectPlanForShopping={(planId) => {
          setSelectedPlanId(planId);
          setIsPlansDrawerOpen(false);
          setIsShoppingOpen(true);
        }}
        onCreateManual={onCreateManualPlan}
        onCreateAI={handleOpenAiGenerator}
        onCreateFromTemplate={handleOpenTemplateLibrary}
      />

      <TemplateLibraryDrawer
        {...getDrawerControl(isTemplateLibraryOpen, setIsTemplateLibraryOpen)}
        onSelectTemplate={handleTemplateSelected}
      />

      <GoalRecalculationDrawer
        {...getDrawerControl(isGoalWizardOpen, setIsGoalWizardOpen)}
      />

      <MealTransferDrawer
        {...getDrawerControl(Boolean(mealTransferContext), (nextOpen) => {
          if (!nextOpen) setMealTransferContext(null);
        })}
        mode={mealTransferContext?.mode}
        food={mealTransferContext?.food}
        sourceMealType={mealTransferContext?.sourceMealType}
        onConfirm={handleConfirmMealTransfer}
      />

      <Drawer {...getDrawerControl(isAIOpen, setIsAIOpen)} direction="bottom">
        <NutritionDrawerContent size="sm">
          <AIGenerator
            onClose={() => setIsAIOpen(false)}
            onGenerated={handleAiGenerated}
          />
        </NutritionDrawerContent>
      </Drawer>

      <ActionDrawer
        {...getDrawerControl(isActionDrawerOpen, setIsActionDrawerOpen)}
        dateKey={dateKey}
        mealType={selectedMealTypeForAdd}
        onOpenSavedMeals={() => setIsSavedMealsOpen(true)}
        onCloseAll={() => setIsActionDrawerOpen(false)}
        disabled={!isOnline}
        onInlineCameraCapture={handleInlineCameraCapture}
      />

      <SavedMealsDrawer
        {...getDrawerControl(isSavedMealsOpen, setIsSavedMealsOpen)}
        dateKey={dateKey}
        mealType={selectedMealTypeForAdd}
        onAddMeal={addMealAction}
        onAddMealsBatch={addMealsBatchAction}
        disabled={!isOnline}
      />

      <InlineScanReviewDrawer
        {...getDrawerControl(Boolean(selectedScan), (nextOpen) => {
          if (!nextOpen) {
            setSelectedScanId(null);
          }
        })}
        scan={selectedScan}
        goals={effectiveGoals}
        onConfirm={handleConfirmInlineScan}
        onConfirmAll={handleConfirmAllInlineScans}
        onDiscard={() => {
          if (selectedScan?.id) {
            handleRemoveScan(selectedScan.id);
          }
        }}
        groupDraftCount={groupDraftCount}
        isSaving={isSavingInlineScan}
      />

      <Drawer
        {...getDrawerControl(Boolean(duplicateMealPrompt), (nextOpen) => {
          if (nextOpen) return;
          duplicateMealPrompt?.resolve(false);
          setDuplicateMealPrompt(null);
        })}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>Bu ovqat allaqachon qo'shilgan</DrawerTitle>
            <DrawerDescription>
              {duplicateMealPrompt?.food?.name || "Bu ovqat"} bugun shu
              bo'limda bor. Yana qo'shishni xohlaysizmi?
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button
              type="button"
              onClick={() => {
                duplicateMealPrompt?.resolve(true);
                setDuplicateMealPrompt(null);
              }}
            >
              Ha, qo'shish
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                duplicateMealPrompt?.resolve(false);
                setDuplicateMealPrompt(null);
              }}
            >
              Yo'q
            </Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>

      <Drawer
        {...getDrawerControl(isPlanMetaOpen, setIsPlanMetaOpen)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>
              {planMetaMode === "edit"
                ? planMetaShouldOpenBuilder
                  ? "Reja ma'lumotlari"
                  : "Reja nomini o'zgartirish"
                : "Yangi reja"}
            </DrawerTitle>
            <DrawerDescription>
              {planMetaMode === "edit"
                ? planMetaShouldOpenBuilder
                  ? "Nom va izohni yangilang."
                  : "Faqat reja nomini yangilang."
                : "Avval reja nomi va izohini saqlang, keyin builder ochiladi."}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-3 pt-0">
            <Input
              value={planMetaName}
              onChange={(event) => setPlanMetaName(event.target.value)}
              placeholder="Masalan: Haftalik protein reja"
              autoFocus
            />
            {planMetaMode !== "edit" || planMetaShouldOpenBuilder ? (
              <Textarea
                value={planMetaDescription}
                onChange={(event) => setPlanMetaDescription(event.target.value)}
                placeholder="Qisqacha izoh yoki maqsadni yozing"
                rows={4}
              />
            ) : null}
          </DrawerBody>
          <DrawerFooter>
            <Button
              onClick={handleSubmitPlanMeta}
              disabled={!planMetaName.trim() || isSavingDraft}
            >
              {planMetaMode === "edit"
                ? planMetaShouldOpenBuilder
                  ? "Saqlash va tahrirlash"
                  : "Nomni saqlash"
                : "Saqlash va davom etish"}
            </Button>
            <Button variant="outline" onClick={() => setIsPlanMetaOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>

      <Drawer
        {...getDrawerControl(isCancelPlanOpen, setIsCancelPlanOpen)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>{currentPlan ? currentPlan.name : "Reja"}</DrawerTitle>
            <DrawerDescription>
              {isCurrentPlanCoachAssigned
                ? "Murabbiy yuborgan reja bilan ishlash usulini tanlang."
                : "Reja bilan nima qilmoqchisiz?"}
            </DrawerDescription>
          </DrawerHeader>
          <NutritionDrawerBody className="flex flex-col gap-3">
            {isCurrentPlanCoachAssigned ? (
              <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-sm text-muted-foreground">
                Murabbiy yuborgan reja o&apos;z holicha saqlanadi. Uni
                o&apos;zgartirish uchun nusxa olib, keyin tahrirlashingiz
                mumkin.
              </div>
            ) : null}
            {isCurrentPlanUpdateAvailable ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300 group"
                disabled={isApplyingCoachUpdate}
                onClick={handleApplyCoachUpdate}
              >
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <RefreshCwIcon className="size-5 text-blue-600 dark:text-blue-300" />
                </div>
                Yangilanishni qo&apos;llash
              </Button>
            ) : null}
            {currentPlan?.status === "active" && (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
                onClick={async () => {
                  try {
                    await pausePlan(currentPlan.id);
                    setIsCancelPlanOpen(false);
                    toast.success("Reja to'xtatildi", {
                      description: "Qoralama sifatida saqlandi",
                    });
                  } catch {
                    toast.error("Rejani to'xtatib bo'lmadi");
                  }
                }}
              >
                <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <PauseIcon className="size-5 text-amber-500" />
                </div>
                Rejani to'xtatish
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
              onClick={handleOpenBuilderManual}
            >
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                {isCurrentPlanCoachAssigned ? (
                  <CopyIcon className="size-5 text-primary" />
                ) : (
                  <PencilIcon className="size-5 text-primary" />
                )}
              </div>
              {isCurrentPlanCoachAssigned
                ? "Nusxalab tahrirlash"
                : "Reja tarkibini tahrirlash"}
            </Button>
            {!isCurrentPlanCoachAssigned ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
                onClick={() => onOpenPlanMetaEdit(false)}
              >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <PencilIcon className="size-5 text-primary" />
                </div>
                Nomini o'zgartirish
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
              disabled={isDuplicatingPlan}
              onClick={handleDuplicateCurrentPlan}
            >
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <CopyIcon className="size-5 text-primary" />
              </div>
              Nusxalash
            </Button>
            {currentPlan?.status !== "archived" &&
            !isCurrentPlanCoachAssigned ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
                disabled={isArchivingPlan}
                onClick={handleArchiveCurrentPlan}
              >
                <div className="size-10 rounded-full bg-muted flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <ArchiveIcon className="size-5 text-foreground" />
                </div>
                Arxivlash
              </Button>
            ) : null}
            {!isCurrentPlanCoachAssigned ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-destructive/5 hover:border-destructive/30 transition-all font-bold text-[15px] text-destructive border-border/50 group"
                onClick={async () => {
                  try {
                    if (currentPlan?.id) {
                      await removePlan(currentPlan.id);
                      setSelectedPlanId(null);
                    }
                    setIsCancelPlanOpen(false);
                    toast.success("Reja o'chirildi");
                  } catch {
                    toast.error("Rejani o'chirib bo'lmadi");
                  }
                }}
              >
                <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Trash2Icon className="size-5 text-destructive" />
                </div>
                Umuman o'chirish
              </Button>
            ) : null}
          </NutritionDrawerBody>
          <DrawerFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelPlanOpen(false)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>

      <Drawer
        {...getDrawerControl(isFilterDrawerOpen, setIsFilterDrawerOpen)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <NutritionFilterDrawer
            activeFilters={sourceFilters}
            mealSearch={mealSearch}
            onMealSearchChange={setMealSearch}
            calorieRange={calorieRange}
            onCalorieRangeChange={setCalorieRange}
            dateRange={filterDateRange}
            onDateRangeChange={setFilterDateRange}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearNutritionFilters}
            onToggleFilter={(key) =>
              setSourceFilters((current) =>
                current.includes(key)
                  ? current.filter((f) => f !== key)
                  : [...current, key],
              )
            }
          />
        </NutritionDrawerContent>
      </Drawer>
    </>
  );
}
