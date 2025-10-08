import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimeSlot {
  period: "morning" | "afternoon" | "evening" | "custom";
  customStart?: string;
  customEnd?: string;
}

interface DayPreference {
  day: string;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

export interface DeliveryPreferencesData {
  days: DayPreference[];
  priority: "low" | "normal" | "high" | "urgent";
  notes?: string;
}

interface DeliveryPreferencesProps {
  value?: DeliveryPreferencesData;
  onChange: (preferences: DeliveryPreferencesData) => void;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const PERIOD_LABELS = {
  morning: "Manhã (8h-12h)",
  afternoon: "Tarde (12h-18h)",
  evening: "Noite (18h-22h)",
  custom: "Horário específico",
};

export const DeliveryPreferences = ({ value, onChange }: DeliveryPreferencesProps) => {
  const createDefaultPreferences = useMemo<() => DeliveryPreferencesData>(
    () => () => ({
      days: DAYS_OF_WEEK.map((day) => ({
        day: day.value,
        enabled: false,
        timeSlots: [],
      })),
      priority: "normal",
      notes: "",
    }),
    []
  );

  const normalizeTimeSlot = useCallback((slot: TimeSlot): TimeSlot => {
    if (slot.period !== "custom") {
      return { period: slot.period };
    }

    const start = slot.customStart || "08:00";
    const end = slot.customEnd || "18:00";

    if (start > end) {
      return { period: "custom", customStart: end, customEnd: start };
    }

    return { period: "custom", customStart: start, customEnd: end };
  }, []);

  const normalizePreferences = useCallback((prefs?: DeliveryPreferencesData): DeliveryPreferencesData => {
    if (!prefs) {
      return createDefaultPreferences();
    }

    const base = createDefaultPreferences();
    return {
      priority: prefs.priority ?? base.priority,
      notes: prefs.notes ?? base.notes,
      days: base.days.map((defaultDay) => {
        const existing = prefs.days.find((day) => day.day === defaultDay.day);
        if (!existing) {
          return defaultDay;
        }

        const sanitizedSlots = existing.enabled
          ? existing.timeSlots.map(normalizeTimeSlot)
          : [];

        return {
          day: defaultDay.day,
          enabled: existing.enabled,
          timeSlots: sanitizedSlots,
        };
      }),
    };
  }, [createDefaultPreferences, normalizeTimeSlot]);

  const [preferences, setPreferences] = useState<DeliveryPreferencesData>(normalizePreferences(value));

  useEffect(() => {
    const normalized = normalizePreferences(value);
    setPreferences((current) => {
      const currentKey = JSON.stringify(current);
      const nextKey = JSON.stringify(normalized);
      return currentKey === nextKey ? current : normalized;
    });
  }, [normalizePreferences, value]);

  const updatePreferences = (newPrefs: DeliveryPreferencesData) => {
    const normalized = normalizePreferences(newPrefs);
    setPreferences(normalized);
    onChange(normalized);
  };

  const toggleDay = (dayValue: string, enabled: boolean) => {
    const newDays = preferences.days.map((day) =>
      day.day === dayValue
        ? {
            ...day,
            enabled,
            timeSlots: enabled ? [{ period: "morning" }] : [],
          }
        : day
    );
    updatePreferences({ ...preferences, days: newDays });
  };

  const addTimeSlot = (dayValue: string) => {
    const newDays = preferences.days.map((day) => {
      if (day.day !== dayValue) {
        return day;
      }

      const lastSlot = day.timeSlots[day.timeSlots.length - 1];
      const defaultSlot: TimeSlot = lastSlot?.period === "custom"
        ? {
            period: "custom",
            customStart: lastSlot.customEnd || lastSlot.customStart || "13:00",
            customEnd: lastSlot.customEnd || "18:00",
          }
        : { period: "afternoon" };

      return {
        ...day,
        timeSlots: [...day.timeSlots, normalizeTimeSlot(defaultSlot)],
      };
    });
    updatePreferences({ ...preferences, days: newDays });
  };

  const removeTimeSlot = (dayValue: string, slotIndex: number) => {
    const newDays = preferences.days.map((day) =>
      day.day === dayValue
        ? { ...day, timeSlots: day.timeSlots.filter((_, i) => i !== slotIndex) }
        : day
    );
    updatePreferences({ ...preferences, days: newDays });
  };

  const updateTimeSlot = (dayValue: string, slotIndex: number, updates: Partial<TimeSlot>) => {
    const newDays = preferences.days.map((day) =>
      day.day === dayValue
        ? {
            ...day,
            timeSlots: day.timeSlots.map((slot, i) =>
              i === slotIndex ? normalizeTimeSlot({ ...slot, ...updates }) : slot
            ),
          }
        : day
    );
    updatePreferences({ ...preferences, days: newDays });
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: { label: "Baixa", variant: "secondary" as const },
      normal: { label: "Normal", variant: "default" as const },
      high: { label: "Alta", variant: "warning" as const },
      urgent: { label: "Urgente", variant: "destructive" as const },
    };
    const config = variants[priority as keyof typeof variants] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Preferências de Entrega
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure os dias e horários disponíveis para entrega
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Priority */}
        <div className="space-y-2">
          <Label>Prioridade da Entrega</Label>
          <div className="flex items-center gap-4">
            <Select
              value={preferences.priority}
              onValueChange={(value) =>
                updatePreferences({ ...preferences, priority: value as any })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            {getPriorityBadge(preferences.priority)}
          </div>
        </div>

        {/* Days and Time Slots */}
        <div className="space-y-4">
          <Label>Dias e Horários Disponíveis</Label>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((dayConfig) => {
              const dayPref = preferences.days.find((d) => d.day === dayConfig.value);
              if (!dayPref) return null;

              return (
                <div key={dayConfig.value} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={dayConfig.value}
                      checked={dayPref.enabled}
                      onCheckedChange={(checked) =>
                        toggleDay(dayConfig.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={dayConfig.value} className="font-medium cursor-pointer">
                      {dayConfig.label}
                    </Label>
                  </div>

                  {dayPref.enabled && (
                    <div className="ml-6 space-y-2">
                      {dayPref.timeSlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={slot.period}
                            onValueChange={(value) =>
                              updateTimeSlot(dayConfig.value, slotIndex, {
                                period: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Manhã (8h-12h)</SelectItem>
                              <SelectItem value="afternoon">Tarde (12h-18h)</SelectItem>
                              <SelectItem value="evening">Noite (18h-22h)</SelectItem>
                              <SelectItem value="custom">Horário específico</SelectItem>
                            </SelectContent>
                          </Select>

                          {slot.period === "custom" && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                className="w-[120px]"
                                value={slot.customStart || ""}
                                onChange={(e) =>
                                  updateTimeSlot(dayConfig.value, slotIndex, {
                                    customStart: e.target.value,
                                  })
                                }
                              />
                              <span className="text-muted-foreground">até</span>
                              <Input
                                type="time"
                                className="w-[120px]"
                                value={slot.customEnd || ""}
                                onChange={(e) =>
                                  updateTimeSlot(dayConfig.value, slotIndex, {
                                    customEnd: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTimeSlot(dayConfig.value, slotIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTimeSlot(dayConfig.value)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar horário
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label>Observações Adicionais</Label>
          <Input
            placeholder="Ex: Ligar antes de ir, portão automático, etc."
            value={preferences.notes || ""}
            onChange={(e) =>
              updatePreferences({ ...preferences, notes: e.target.value })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
