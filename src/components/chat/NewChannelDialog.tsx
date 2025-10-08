import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NewChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChannelDialog({ open, onOpenChange }: NewChannelDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      description: "",
      channel_type: "team",
      department_id: "",
      is_private: false,
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const payload = {
        name: data.name,
        description: data.description || null,
        channel_type: data.channel_type,
        department_id: data.department_id || null,
        is_private: data.is_private,
        created_by: user.id,
      };

      // Create channel
      const { data: channel, error: channelError } = await supabase
        .from("chat_channels")
        .insert([payload])
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("chat_channel_members")
        .insert([{
          channel_id: channel.id,
          user_id: user.id,
          role: "admin",
        }]);

      if (memberError) throw memberError;

      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatChannels"] });
      toast.success("Canal criado com sucesso");
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao criar canal: " + (error as Error).message);
    },
  });

  const onSubmit = (data: any) => {
    createChannelMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Canal de Chat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Canal *</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="Digite o nome do canal"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descreva o propósito deste canal"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="channel_type">Tipo de Canal</Label>
            <Select value={watch("channel_type")} onValueChange={(value) => setValue("channel_type", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="department">Departamento</SelectItem>
                <SelectItem value="team">Equipe/Projeto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watch("channel_type") === "department" && (
            <div>
              <Label htmlFor="department_id">Departamento</Label>
              <Select value={watch("department_id")} onValueChange={(value) => setValue("department_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="is_private">Canal Privado</Label>
            <Switch
              id="is_private"
              checked={watch("is_private")}
              onCheckedChange={(checked) => setValue("is_private", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createChannelMutation.isPending}>
              {createChannelMutation.isPending ? "Criando..." : "Criar Canal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
