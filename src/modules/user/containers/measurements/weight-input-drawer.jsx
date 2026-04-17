import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { map, get } from "lodash";
import { WeightPicker } from "@/modules/onboarding/components/weight-picker";

export const WeightInputDrawer = ({
  open,
  setOpen,
  selectedDate,
  setSelectedDate,
  form,
  onSubmit,
}) => {
  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Vazn kiritish</DrawerTitle>
          <DrawerDescription>
            Bugungi yoki o'tgan kundagi joriy vazningizni kiriting va saqlang.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
            {map([...Array(7)], (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const isSelected =
                get(selectedDate, "toDateString") &&
                selectedDate.toDateString() === d.toDateString();
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 px-6 flex-1 rounded-2xl border transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary/60 border-primary text-primary-foreground"
                      : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="text-[10px] font-bold uppercase opacity-60">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-lg font-black">{d.getDate()}</span>
                </div>
              );
            })}
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col items-center gap-6"
            >
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem className="relative w-full px-3">
                    <FormControl>
                      <div className="mx-auto w-full max-w-xs rounded-[28px] bg-muted/20 px-2 py-1">
                        <WeightPicker
                          value={get(field, "value")}
                          onChange={field.onChange}
                          unit="kg"
                          itemHeight={52}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="absolute -bottom-6 text-center w-full" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DrawerBody>
        <DrawerFooter className="mt-5">
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
