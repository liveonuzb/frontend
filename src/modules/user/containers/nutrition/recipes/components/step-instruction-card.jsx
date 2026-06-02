import React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RecipeImage from "./recipe-image.jsx";

const StepInstructionCard = ({
  step,
  index,
  isFirst,
  isLast,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => (
  <Card size="sm">
    <CardContent className="grid gap-4 p-4 md:grid-cols-[auto_36px_minmax(0,1fr)_110px_auto] md:items-center">
      <div className="hidden text-muted-foreground md:block">
        <GripVerticalIcon className="size-4" />
      </div>
      <div className="grid size-9 place-items-center rounded-full bg-muted text-sm font-semibold text-primary">
        {index + 1}
      </div>
      <div className="grid gap-3">
        <Input
          aria-label={`${index + 1}-qadam sarlavhasi`}
          value={step.title}
          onChange={(event) => onChange(step.id, { title: event.target.value })}
        />
        <Textarea
          aria-label={`${index + 1}-qadam tavsifi`}
          value={step.description}
          onChange={(event) =>
            onChange(step.id, { description: event.target.value })
          }
        />
      </div>
      <Input
        type="number"
        min="0"
        aria-label={`${index + 1}-qadam davomiyligi`}
        value={step.durationMinutes}
        onChange={(event) =>
          onChange(step.id, { durationMinutes: event.target.value })
        }
      />
      <div className="flex items-center gap-2">
        <div className="hidden size-16 overflow-hidden rounded-xl bg-muted lg:block">
          <RecipeImage src={step.imageUrl} alt={step.title} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${index + 1}-qadamni yuqoriga ko'chirish`}
            disabled={isFirst}
            onClick={() => onMoveUp(step.id)}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${index + 1}-qadamni pastga ko'chirish`}
            disabled={isLast}
            onClick={() => onMoveDown(step.id)}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${step.title || `${index + 1}-qadam`}ni o'chirish`}
            onClick={() => onDelete(step.id)}
          >
            <Trash2Icon />
          </Button>
        </div>
        {step.imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${index + 1}-qadam rasmini olib tashlash`}
            onClick={() => onChange(step.id, { imageUrl: "" })}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
    </CardContent>
  </Card>
);

export default StepInstructionCard;
