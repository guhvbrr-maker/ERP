import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { buscarEnderecoPorCEP, formatarCEP } from '@/lib/cepService';
import { useToast } from '@/hooks/use-toast';

interface CepAddressFormProps {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  onCepChange: (value: string) => void;
  onLogradouroChange: (value: string) => void;
  onNumeroChange: (value: string) => void;
  onComplementoChange: (value: string) => void;
  onBairroChange: (value: string) => void;
  onCidadeChange: (value: string) => void;
  onUfChange: (value: string) => void;
}

export function CepAddressForm({
  cep,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  uf,
  onCepChange,
  onLogradouroChange,
  onNumeroChange,
  onComplementoChange,
  onBairroChange,
  onCidadeChange,
  onUfChange,
}: CepAddressFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBuscarCep = async () => {
    if (!cep) {
      toast({
        title: 'CEP não informado',
        description: 'Por favor, informe um CEP para buscar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const endereco = await buscarEnderecoPorCEP(cep);

      if (endereco) {
        onLogradouroChange(endereco.logradouro);
        onBairroChange(endereco.bairro);
        onCidadeChange(endereco.localidade);
        onUfChange(endereco.uf);
        if (endereco.complemento) {
          onComplementoChange(endereco.complemento);
        }

        toast({
          title: 'Endereço encontrado',
          description: 'Dados do endereço preenchidos automaticamente',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao buscar CEP',
        description: error instanceof Error ? error.message : 'Verifique o CEP e tente novamente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatarCEP(value);
    onCepChange(formatted);
  };

  const handleCepKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBuscarCep();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            onKeyPress={handleCepKeyPress}
            maxLength={9}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={handleBuscarCep}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="logradouro">Logradouro</Label>
          <Input
            id="logradouro"
            placeholder="Rua, Avenida, etc."
            value={logradouro}
            onChange={(e) => onLogradouroChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            placeholder="123"
            value={numero}
            onChange={(e) => onNumeroChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            placeholder="Apto, Bloco, etc."
            value={complemento}
            onChange={(e) => onComplementoChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            placeholder="Bairro"
            value={bairro}
            onChange={(e) => onBairroChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            placeholder="Cidade"
            value={cidade}
            onChange={(e) => onCidadeChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="uf">UF</Label>
          <Input
            id="uf"
            placeholder="SP"
            value={uf}
            onChange={(e) => onUfChange(e.target.value.toUpperCase())}
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
}
