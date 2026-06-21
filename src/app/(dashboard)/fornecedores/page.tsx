'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', document_tax_id: '' });
  const [status, setStatus] = useState<{ type: 'error' | 'ok', msg: string } | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (!error && data) {
      setSuppliers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    setSubmitting(true);
    setStatus(null);

    const { error } = await supabase.from('suppliers').insert([
      { name: form.name.toUpperCase(), document_tax_id: form.document_tax_id }
    ]);

    if (error) {
      setStatus({ type: 'error', msg: 'Erro ao cadastrar fornecedor: ' + error.message });
    } else {
      setStatus({ type: 'ok', msg: 'Fornecedor cadastrado com sucesso!' });
      setForm({ name: '', document_tax_id: '' });
      loadSuppliers();
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h1>Fornecedores</h1>
      <p className="subtitle">Gerencie os fornecedores cadastrados</p>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Novo Fornecedor</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="field">
              <label>Nome / Razão Social *</label>
              <input 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="Ex: EMPRESA LTDA"
                required
                disabled={submitting}
              />
            </div>
            <div className="field">
              <label>CNPJ / CPF</label>
              <input 
                value={form.document_tax_id} 
                onChange={e => setForm({...form, document_tax_id: e.target.value})} 
                placeholder="Opcional"
                disabled={submitting}
              />
            </div>
            
            {status && <div className={`status ${status.type}`}>{status.msg}</div>}

            <div className="btn-row" style={{ marginTop: '4px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !form.name}>
                {submitting ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Fornecedores Cadastrados</div>
          {loading ? <p>Carregando...</p> : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CNPJ/CPF</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.document_tax_id || '-'}</td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center' }}>Nenhum fornecedor cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
