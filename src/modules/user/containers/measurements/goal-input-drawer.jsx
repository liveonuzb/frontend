import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerFooter,
  DrawerHeader,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { get } from "lodash";
import { WeightPicker } from "@/modules/onboarding/components/weight-picker";

export const GoalInputDrawer = ({ open, setOpen, form, onSubmit }) => {
  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Maqsad (Vazn)</DrawerTitle>
          <DrawerDescription>
            Kelajakda qanday vaznga erishmoqchi ekanligingizni kiriting.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
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
