'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DocumentosPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'ok', msg: string } | null>(null);

  const [form, setForm] = useState({
    document_type: 'NOTA_FISCAL',
    document_number: '',
    document_date: '',
    supplier_id: '',
    purchase_order: '',
    cost_center: '',
    due_date: '',
    total_amount: '',
    origem_obra: '',
    destino: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    // Load suppliers for select
    const { data: supData } = await supabase.from('suppliers').select('id, name').order('name');
    if (supData) setSuppliers(supData);

    // Load recent docs
    const { data: docData } = await supabase
      .from('documents')
      .select('*, suppliers(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (docData) setDocuments(docData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.document_number || !form.supplier_id || !form.document_date || !form.total_amount) return;

    setSubmitting(true);
    setStatus(null);

    const amountNum = parseFloat(form.total_amount.replace(',', '.'));

    const { error } = await supabase.from('documents').insert([{
      document_type: form.document_type,
      document_number: form.document_number,
      document_date: form.document_date,
      supplier_id: form.supplier_id,
      purchase_order: form.purchase_order || null,
      cost_center: form.cost_center || null,
      due_date: form.due_date || null,
      total_amount: amountNum,
      origem_obra: form.origem_obra || null,
      destino: form.destino || null,
      notes: form.notes || null
    }]);

    if (error) {
      if (error.code === '23505') { // Postgres Unique Violation
        setStatus({ type: 'error', msg: '⛔ Este número de documento já foi lançado para este fornecedor (Duplicidade Bloqueada).' });
      } else {
        setStatus({ type: 'error', msg: 'Erro ao lançar: ' + error.message });
      }
    } else {
      setStatus({ type: 'ok', msg: '✅ Documento lançado com sucesso!' });
      // Reset some fields but keep context like center, date
      setForm({ ...form, document_number: '', total_amount: '', notes: '' });
      loadData();
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h1>Lançamento de Documentos</h1>
      <p className="subtitle">Registre Notas Fiscais e Boletos</p>

      <div className="card">
        <div className="card-title">Novo Lançamento</div>
        <form onSubmit={handleSubmit} className="grid-2">
          
          <div className="field">
            <label>Tipo *</label>
            <select name="document_type" value={form.document_type} onChange={handleChange} required disabled={submitting}>
              <option value="NOTA_FISCAL">Nota Fiscal</option>
              <option value="BOLETO">Boleto</option>
            </select>
          </div>

          <div className="field">
            <label>Fornecedor *</label>
            <select name="supplier_id" value={form.supplier_id} onChange={handleChange} required disabled={submitting}>
              <option value="">Selecione...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {suppliers.length === 0 && <span className="hint">Nenhum fornecedor cadastrado.</span>}
          </div>

          <div className="field">
            <label>Nº do Documento *</label>
            <input name="document_number" value={form.document_number} onChange={handleChange} placeholder="Ex: 12345" required disabled={submitting} />
          </div>

          <div className="field">
            <label>Data de Emissão *</label>
            <input type="date" name="document_date" value={form.document_date} onChange={handleChange} required disabled={submitting} />
          </div>

          <div className="field">
            <label>Valor Total (R$) *</label>
            <input type="number" step="0.01" name="total_amount" value={form.total_amount} onChange={handleChange} placeholder="0.00" required disabled={submitting} />
          </div>

          <div className="field">
            <label>Vencimento</label>
            <input type="date" name="due_date" value={form.due_date} onChange={handleChange} disabled={submitting} />
          </div>

          <div className="field">
            <label>Pedido de Compra</label>
            <input name="purchase_order" value={form.purchase_order} onChange={handleChange} disabled={submitting} />
          </div>

          <div className="field">
            <label>Centro de Custo</label>
            <input name="cost_center" value={form.cost_center} onChange={handleChange} disabled={submitting} />
          </div>

          <div className="field" style={{ gridColumn: 'span 2' }}>
            {status && <div className={`status ${status.type}`}>{status.msg}</div>}
          </div>

          <div className="btn-row" style={{ gridColumn: 'span 2', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Documento'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Últimos Lançamentos</div>
        {loading ? <p>Carregando...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Fornecedor</th>
                  <th>Tipo</th>
                  <th>Nº Doc</th>
                  <th>Valor</th>
                  <th>C. Custo</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id}>
                    <td>{new Date(d.document_date).toLocaleDateString('pt-BR')}</td>
                    <td>{d.suppliers?.name}</td>
                    <td>{d.document_type === 'NOTA_FISCAL' ? 'NF' : 'Boleto'}</td>
                    <td style={{ fontWeight: 'bold' }}>{d.document_number}</td>
                    <td>R$ {Number(d.total_amount).toFixed(2).replace('.', ',')}</td>
                    <td>{d.cost_center || '-'}</td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>Nenhum lançamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
