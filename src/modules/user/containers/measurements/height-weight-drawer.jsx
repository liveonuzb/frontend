import React from "react";
import { times, get } from "lodash";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerFooter,
  DrawerHeader,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ScrollPicker } from "@/components/ui/scroll-picker";

const heightItems = times(250 - 100 + 1, (index) => {
  const value = String(index + 100);
  return {
    value,
    label: value,
  };
});

export const HeightWeightDrawer = ({ open, setOpen, form, onSubmit }) => {
  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto pt-4">
        <DrawerHeader>
          <DrawerTitle>Bo&apos;y</DrawerTitle>
          <DrawerDescription>Bo&apos;yingizni kiriting.</DrawerDescription>
        </DrawerHeader>

        <div className="pt-2 pb-4 max-w-xs mx-auto px-3">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem className="relative w-full">
                      <FormControl>
                        <div className="flex justify-center items-center w-full gap-4">
                          <div className="w-24">
                            <ScrollPicker
                              items={heightItems}
                              value={String(get(field, "value") || "170")}
                              onChange={field.onChange}
                              itemHeight={56}
                            />
                          </div>
                          <span className="text-2xl font-bold flex shrink-0">
                            cm
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className="pt-2 text-center w-full" />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <DrawerFooter>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
