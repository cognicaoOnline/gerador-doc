import { supabase } from '@/lib/supabase';

export default async function DashboardPage() {
  // Simulando busca de métricas. Em um cenário real, contaremos os registros no Supabase.
  const { count: suppliersCount } = await supabase.from('suppliers').select('*', { count: 'exact', head: true });
  const { count: docsCount } = await supabase.from('documents').select('*', { count: 'exact', head: true });
  const { count: rensCount } = await supabase.from('ren_headers').select('*', { count: 'exact', head: true });

  return (
    <div>
      <h1>Visão Geral</h1>
      <p className="subtitle">Métricas e resumo do sistema</p>

      <div className="grid-3">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Documentos Lançados</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {docsCount || 0}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Fornecedores Cadastrados</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {suppliersCount || 0}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">RENs Geradas</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {rensCount || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
