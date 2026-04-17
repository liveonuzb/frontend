import React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMask } from "@react-input/mask";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

const DatePicker = ({ value, onChange, placeholder = "DD.MM.YYYY", className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Sync inputValue with external value
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (isValid(date)) {
        setInputValue(format(date, "dd.MM.yyyy"));
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const inputRef = useMask({
    mask: "__.__.____",
    replacement: { _: /\d/ },
    onMask: (event) => {
      const { value: maskedValue } = event.detail;
      setInputValue(maskedValue);

      if (maskedValue.length === 10) {
        const parts = maskedValue.split(".");
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let corrected = false;

        // Validate Year (2000 - 2100)
        if (year < 2000) {
          year = 2000;
          corrected = true;
        } else if (year > 2100) {
          year = 2100;
          corrected = true;
        }

        // Validate Month (1 - 12)
        if (month > 12) {
          month = 12;
          corrected = true;
        } else if (month < 1) {
          month = 1;
          corrected = true;
        }

        // Validate Day (based on Month/Year)
        const maxDays = new Date(year, month, 0).getDate();
        if (day > maxDays) {
          day = maxDays;
          corrected = true;
        } else if (day < 1) {
          day = 1;
          corrected = true;
        }

        const formattedDay = String(day).padStart(2, "0");
        const formattedMonth = String(month).padStart(2, "0");
        const finalValue = `${formattedDay}.${formattedMonth}.${year}`;

        if (corrected) {
          setInputValue(finalValue);
        }

        const parsedDate = parse(finalValue, "dd.MM.yyyy", new Date());
        if (isValid(parsedDate)) {
          onChange?.(format(parsedDate, "yyyy-MM-dd"));
        }
      } else if (maskedValue === "") {
        onChange?.("");
      }
    },
  });

  const handleDateSelect = (date) => {
    if (date) {
      const formatted = format(date, "dd.MM.yyyy");
      setInputValue(formatted);
      onChange?.(format(date, "yyyy-MM-dd"));
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <InputGroup className="h-11 rounded-2xl bg-card">
        <InputGroupInput
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="px-4 text-sm"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-sm"
            onClick={() => setIsOpen(true)}
            aria-label="Kalendarni ochish"
            className="mr-1"
          >
            <CalendarIcon className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="bottom">
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Sanani tanlang</DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center p-4">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={handleDateSelect}
              initialFocus
            />
          </div>
          <DrawerFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Yopish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default DatePicker;
